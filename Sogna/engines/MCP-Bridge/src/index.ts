import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { existsSync } from "fs";
import fs from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import {
  MCP_AMPLIFIER_TOOLS,
  MCP_AMPLIFIER_READ_TOOLS,
  handleAmplifierTool,
} from "./sognatoreMcp.js";
import { mountDelegateApi } from "./delegateApi.js";
import { requireDelegateApiToken } from "./delegateAuth.js";
import { checkMcpWritePolicy, checkEnqueueRateLimit, getToolTimeoutMs } from "./mcpToolPolicy.js";
import { requireMcpToken, isMcpAuthEnabled } from "./mcpLocalAuth.js";
import {
  getMcpMetrics,
  recordCircuitBreakerTrip,
  recordRateLimit,
  recordSseConnection,
  recordToolResult,
  recordVeto,
  recordWriteDenial,
} from "./mcpObservability.js";
import {
  cleanupStreamableSessions,
  createStreamablePostHandler,
  getStreamableSessionCount,
  tryHandleStreamableGet,
} from "./streamableMcp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Mata el árbol de procesos sin shell (evita escapes de backslash en Windows). */
function forceKillProcessTree(pid: number | undefined): void {
  if (!pid) return;
  try {
    const killer =
      process.platform === "win32"
        ? spawn("taskkill", ["/F", "/T", "/PID", String(pid)], {
            shell: false,
            windowsHide: true,
            stdio: "ignore",
          })
        : spawn("kill", ["-9", `-${pid}`], { shell: false, stdio: "ignore" });
    killer.unref();
  } catch {
    // best-effort
  }
}

/** Ejecución con timeout; rechaza si exitCode !== 0 (fail-closed para Sentinel). */
function runCommandWithTimeout(command: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";
    let resolved = false;

    const rejectTimeout = () => {
      const err = new Error(
        `Command timed out after ${timeoutMs}ms and was forcefully terminated.`
      ) as Error & CommandResult;
      err.stdout = stdout;
      err.stderr = stderr;
      err.exitCode = -1;
      reject(err);
    };

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      console.warn(`[TIMEOUT] Process ${child.pid} exceeded ${timeoutMs}ms. Forcing tree termination.`);
      forceKillProcessTree(child.pid);
      try {
        child.kill("SIGKILL");
      } catch {
        // best-effort
      }
      rejectTimeout();
    }, timeoutMs);
    
    child.on("close", (code) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const exitCode = code ?? 1;
      const result = { stdout, stderr, exitCode };
      if (exitCode !== 0) {
        const err = new Error(`Process exited with code ${exitCode}`) as Error & CommandResult;
        err.stdout = stdout;
        err.stderr = stderr;
        err.exitCode = exitCode;
        reject(err);
        return;
      }
      resolve(result);
    });
    
    child.on("error", (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

// --- GLOBAL SAFETY NET ---
process.on('uncaughtException', (err) => {
  console.error('Sognatore [CRITICAL]: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Sognatore [CRITICAL]: Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- Configuración de Rutas (resolución dinámica, portable) ---
const SOGNA_IDENTITY_MARKER = path.join("memory", "identity", "sogna.md");

function isSognaProjectRoot(dir: string): boolean {
  return existsSync(path.join(dir, SOGNA_IDENTITY_MARKER));
}

/**
 * Raíz operativa del paquete Sogna (directorio que contiene memory/, Sognatore/, Curator/).
 * Prioridad: SOGNA_ROOT (env) > ruta relativa al bridge > cwd.
 */
function resolveSognaRoot(): string {
  const envRoot = process.env.SOGNA_ROOT?.trim();
  if (envRoot) {
    const resolved = path.resolve(envRoot);
    if (!isSognaProjectRoot(resolved)) {
      throw new Error(
        `SOGNA_ROOT no es válido (falta ${SOGNA_IDENTITY_MARKER}): ${resolved}`
      );
    }
    return resolved;
  }

  const candidates = [
    path.resolve(__dirname, "../../../.."),
    path.resolve(process.cwd()),
    path.resolve(process.cwd(), "Sogna"),
  ];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (isSognaProjectRoot(normalized)) {
      return normalized;
    }
  }

  throw new Error(
    "No se pudo resolver la raíz de Sogna. Defina SOGNA_ROOT o ejecute el bridge desde el monorepo (memory/identity/sogna.md debe existir)."
  );
}

const ROOT_PATH = resolveSognaRoot();
const GRAPH_PATH = path.join(ROOT_PATH, "memory", "intelligence", "semantic", "graph.json");
const IDENTITY_PATH = path.join(ROOT_PATH, "memory", "identity", "sogna.md");
const SWARM_STATE_PATH = path.join(ROOT_PATH, "memory", "operational", "agent", "active_state.json");
const SENTINEL_VETO_PATH = path.join(ROOT_PATH, "Sentinel", "bin", "sentinel-veto.js");
const VETO_TMP_DIR = path.join(ROOT_PATH, "Sentinel", ".veto_tmp");
const AUDIT_LOG_PATH = path.join(ROOT_PATH, "memory", "operational", "logs", "mcp_audit.json");

// --- SEGURIDAD: Funciones deterministas de validación pre-veto ---

/** Segmentos ../ o ..\ — no coincide con elipsis (...) ni puntos en prosa. */
const PATH_TRAVERSAL_RE = /(?:^|[\\/])\.\.(?:[\\/]|$)|\.\.\/|\.\.\\/;
const PROSE_FIELD_KEYS = new Set(["mission", "last_milestone", "description", "message", "text", "title"]);
const PATH_LIKE_KEY_RE = /^(path|file|dir|target|source|dest|output|share|ref|uri|url|cwd|root)$/i;

function looksLikeFilesystemPath(val: string): boolean {
  return (
    PATH_TRAVERSAL_RE.test(val) ||
    /^[a-zA-Z]:[\\/]/.test(val) ||
    val.startsWith("/") ||
    val.startsWith("\\\\") ||
    /^[\w.-]+[\\/][\w./\\-]+$/.test(val)
  );
}

function isPathEvasion(val: string, fieldKey?: string): boolean {
  if (typeof val !== "string" || !val.trim()) return false;

  const isProseField = fieldKey ? PROSE_FIELD_KEYS.has(fieldKey) : false;
  if (isProseField && !looksLikeFilesystemPath(val)) {
    return false;
  }

  if (PATH_TRAVERSAL_RE.test(val)) {
    return true;
  }

  const isWindowsAbsolute = /^[a-zA-Z]:[\\/]/.test(val);
  const isUnixAbsolute = val.startsWith("/");
  const isUncPath = val.startsWith("\\\\");

  if (isWindowsAbsolute || isUnixAbsolute || isUncPath) {
    try {
      const resolvedVal = path.resolve(val).replace(/\\/g, "/").toLowerCase();
      const resolvedRoot = path.resolve(ROOT_PATH).replace(/\\/g, "/").toLowerCase();
      if (!resolvedVal.startsWith(resolvedRoot)) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

const SHELL_CMD_AFTER_SEP =
  /^(npm|node|git|rm|del|taskkill|cmd|powershell|sh|bash|cat|echo|mkdir|rmdir|copy|move)\b/i;

function hasShellInjection(val: string, fieldKey?: string): boolean {
  if (typeof val !== "string") return false;

  const isProseField = fieldKey ? PROSE_FIELD_KEYS.has(fieldKey) : false;

  const highRiskPatterns = ["&&", "||", "`", "$(", "${", "\n"];
  for (const pattern of highRiskPatterns) {
    if (val.includes(pattern)) {
      return true;
    }
  }

  // Pipe solo si encadena un comando shell reconocible (no "A | B" en prosa)
  if (/\|\s*(?:npm|node|git|rm|del|taskkill|cmd|powershell|sh|bash)\b/i.test(val)) {
    return true;
  }
  if (!isProseField && /\s\|\s/.test(val) && SHELL_CMD_AFTER_SEP.test(val.split("|").pop()?.trim() || "")) {
    return true;
  }

  if (val.includes(";")) {
    const parts = val.split(";");
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (SHELL_CMD_AFTER_SEP.test(part)) {
        return true;
      }
    }
  }

  return false;
}

function inspectValue(val: unknown, keyPath = ""): { isVetoed: boolean; reason: string } {
  if (val === null || val === undefined) return { isVetoed: false, reason: "" };

  if (typeof val === "string") {
    const fieldKey = keyPath.split(".").pop() || "";
    const treatAsPath =
      PATH_LIKE_KEY_RE.test(fieldKey) || (!PROSE_FIELD_KEYS.has(fieldKey) && looksLikeFilesystemPath(val));

    if (treatAsPath && isPathEvasion(val, fieldKey)) {
      return {
        isVetoed: true,
        reason: `Intento de evasión de directorio o acceso fuera de ROOT_PATH detectado en argumento: "${val.slice(0, 120)}"`,
      };
    }
    if (hasShellInjection(val, fieldKey)) {
      return {
        isVetoed: true,
        reason: `Patrón sospechoso de inyección de comandos de shell detectado en argumento: "${val.slice(0, 120)}"`,
      };
    }
  } else if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const res = inspectValue(val[i], `${keyPath}[${i}]`);
      if (res.isVetoed) return res;
    }
  } else if (typeof val === "object") {
    for (const key of Object.keys(val as Record<string, unknown>)) {
      const nextPath = keyPath ? `${keyPath}.${key}` : key;
      const res = inspectValue((val as Record<string, unknown>)[key], nextPath);
      if (res.isVetoed) return res;
    }
  }
  return { isVetoed: false, reason: "" };
}

function sentinelOutputIndicatesVeto(output: string): boolean {
  return output.includes("[CRITICAL]") || output.includes("[VETO]");
}

// --- Esquemas de Validación (SSOT) ---
const SwarmStateSchema = z.object({
  mission: z.string(),
  hardening_status: z.string(),
  synapse_state: z.string(),
  pending_tasks: z.array(z.string()),
  last_milestone: z.string(),
});

/**
 * Utilidad de Logging Forense (Optimización JSONL)
 * Evita ciclos de lectura/escritura masivos para alto rendimiento.
 */
async function auditLog(action: string, details: any) {
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    details,
  }) + "\n";
  
  try {
    // Uso de appendFile para evitar cuellos de botella de rendimiento
    await fs.appendFile(AUDIT_LOG_PATH, logEntry, "utf-8");
  } catch (e) {
    console.error("Fallo crítico en auditLog:", e);
  }
}

// Diccionario de reemplazos institucional para el filtro lingüístico
const LINGUISTIC_REPLACEMENTS: Record<string, string> = {
  "perfectly": "correctly",
  "perfectamente": "correctamente",
  "flawlessly": "correctly",
  "impecablemente": "adecuadamente",
  "impeccably": "properly",
  "impeccable": "proper",
  "flawless": "clean",
  "perfect": "correct",
  "perfecto": "correcto",
  "impecable": "correcto",
  "excelente": "correcto",
  "excellent": "correct",
  "summary of accomplishments": "Walkthrough",
  "resumen de logros": "Cambios realizados"
};

// RegExp unificada compilada estáticamente para latencia cero
const LINGUISTIC_PATTERN = /\b(perfectly|perfectamente|flawlessly|impecablemente|impeccably|impeccable|flawless|perfect|perfecto|impecable|excelente|excellent)\b|\b(summary of accomplishments|resumen de logros)\b/gi;

/**
 * Filtro Lingüístico Nativo (Output Interceptor)
 * Elimina superlativos, fluff y clichés de IA en una única pasada O(N) para mantener un tono institucional.
 */
function sanitizeOutputText(text: string): string {
  if (!text) return text;
  return text.replace(LINGUISTIC_PATTERN, (matched) => {
    const key = matched.toLowerCase();
    const replacement = LINGUISTIC_REPLACEMENTS[key];
    if (!replacement) return matched;
    // Preservar mayúscula inicial si existía en el término original
    if (matched && matched[0] === matched[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

// --- Fábrica de Servidores MCP (Multi-Client Compliant) ---
function createMcpServer(mcpSessionId?: string): Server {
  const server = new Server(
    {
      name: "Sognatore",
      version: "institutional",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // --- MANEJADORES DE RECURSOS (Resources) ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "sogna://identity/standard",
          name: "Sogna Identity Standard (SSOT)",
          description: "The core linguistic and behavioral rules for Sogna.",
          mimeType: "text/markdown",
        },
        {
          uri: "sogna://intelligence/graph",
          name: "Sogna Semantic Graph",
          description: "The complete structure of knowledge nodes and relations.",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    await auditLog("READ_RESOURCE", { uri });

    try {
      if (uri === "sogna://identity/standard") {
        const content = await fs.readFile(IDENTITY_PATH, "utf-8");
        return {
          contents: [{ uri, mimeType: "text/markdown", text: content }],
        };
      }

      if (uri === "sogna://intelligence/graph") {
        const content = await fs.readFile(GRAPH_PATH, "utf-8");
        return {
          contents: [{ uri, mimeType: "application/json", text: content }],
        };
      }
    } catch (error) {
      throw new Error(`Error al leer recurso SSOT: ${error instanceof Error ? error.message : "Desconocido"}`);
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // --- MANEJADORES DE PROMPTS (Dynamic Prompts) ---
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "sogna-alignment",
          description: "Injects core identity and current swarm mission for task alignment.",
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    await auditLog("GET_PROMPT", { name });

    if (name === "sogna-alignment") {
      const identity = await fs.readFile(IDENTITY_PATH, "utf-8");
      const swarm = await fs.readFile(SWARM_STATE_PATH, "utf-8");
      
      return {
        description: "Sogna Alignment Pulse",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `System Alignment Required.\n\nIDENTITY SSOT:\n${identity}\n\nCURRENT SWARM STATE:\n${swarm}\n\nMaintain technical institutional tone. Zero irrelevant adjectives. Proceed with precision.`,
            },
          },
        ],
      };
    }

    throw new Error(`Prompt not found: ${name}`);
  });

  // --- MANEJADORES DE HERRAMIENTAS (Tools) ---
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_swarm_telemetry",
          description: "Retrieves the real-time operational state of the 41-agent swarm",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "read_audit_logs",
          description: "Reads the mcp_audit.json file to self-diagnose ecosystem health and recent operations",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "verify_sentinel_integrity",
          description: "Runs the Sentinel security engine to audit system integrity and signatures",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "update_swarm_mission",
          description: "Updates the current swarm mission with atomic validation (SSOT)",
          inputSchema: {
            type: "object",
            properties: {
              mission: { type: "string" },
              last_milestone: { type: "string" },
            },
            required: ["mission", "last_milestone"],
          },
        },
        {
          name: "get_sentinel_status",
          description: "Devuelve el número total de firmas válidas, tamaño de la base de datos, y estado del watcher.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_memory_graph_telemetry",
          description: "Devuelve métricas sobre el Knowledge Graph de UMA (número de nodos, densidad de enlaces, grado de entropía).",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "run_synaptic_validation",
          description: "Ejecuta una validación rápida de enlaces huérfanos e integridad del grafo en segundo plano.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "run_consolidation_pipeline",
          description: "Ejecucion del pipeline de consolidacion sinaptica completo (3 fases). Phase 1: Working Memory -> Episodic Memory. Phase 2: Episodic Memory -> Semantic Memory. Phase 3: Semantic Memory -> Knowledge Graph validation.",
          inputSchema: { type: "object", properties: {} },
        },
        ...MCP_AMPLIFIER_TOOLS,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const t0 = Date.now();
    await auditLog("CALL_TOOL", { name, args });

    const writePolicy = checkMcpWritePolicy(name);
    if (!writePolicy.allowed) {
      recordWriteDenial(name, mcpSessionId);
      recordToolResult(name, Date.now() - t0, false, mcpSessionId, "write_denied");
      return {
        content: [{ type: "text", text: writePolicy.reason || "Escritura MCP no permitida." }],
        isError: true,
      };
    }
    const ratePolicy = checkEnqueueRateLimit(mcpSessionId, name);
    if (!ratePolicy.allowed) {
      recordRateLimit(name, mcpSessionId);
      recordToolResult(name, Date.now() - t0, false, mcpSessionId, "rate_limit");
      return {
        content: [{ type: "text", text: ratePolicy.reason || "Rate limit excedido." }],
        isError: true,
      };
    }

    const timeoutMs = getToolTimeoutMs(name);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `La herramienta '${name}' superó el tiempo máximo de seguridad (${Math.round(timeoutMs / 1000)}s). Ejecución abortada.`,
            ),
          ),
        timeoutMs,
      ),
    );

    try {
      const executePromise = (async () => {
        // --- [SENTINEL VETO INTERCEPTOR] ---
        // Herramientas exentas de veto estricto (solo lectura)
        const exemptedTools = [
          "get_swarm_telemetry", 
          "read_audit_logs", 
          "verify_sentinel_integrity",
          "get_sentinel_status",
          "get_memory_graph_telemetry",
          "run_synaptic_validation",
          "run_consolidation_pipeline",
          ...Array.from(MCP_AMPLIFIER_READ_TOOLS),
        ];
        
        if (!exemptedTools.includes(name)) {
          // 1. Auditoría pre-veto determinista y preventiva local (latencia cero)
          const preVeto = inspectValue(args);
          if (preVeto.isVetoed) {
            await auditLog("SENTINEL_PRE_VETO", { tool: name, args, reason: preVeto.reason });
            recordVeto(name, "pre", mcpSessionId);
            return {
              content: [{ 
                type: "text", 
                text: `🛡️ [SENTINEL PRE-VETO PREVENTIVO]\n\nSe ha bloqueado la ejecución de la herramienta '${name}' de forma preventiva para proteger la integridad del sistema.\n\nMotivo:\n${preVeto.reason}` 
              }],
              isError: true,
            };
          }

          // 2. Archivo temporal único por invocación (evita condición de carrera entre sesiones SSE)
          await fs.mkdir(VETO_TMP_DIR, { recursive: true });
          const sessionTag = mcpSessionId ? mcpSessionId.slice(0, 8) : "anon";
          const tmpPath = path.join(VETO_TMP_DIR, `veto_${sessionTag}_${randomUUID()}.json`);
          await fs.writeFile(tmpPath, JSON.stringify({ tool: name, args }, null, 2));

          // 3. Ejecutar Sentinel (fail-closed: exit !== 0, timeout o spawn error → veto)
          let sentinelOutput = "";
          let sentinelFailed = false;
          let timeoutReached = false;
          try {
            const result = await runCommandWithTimeout("node", [SENTINEL_VETO_PATH, tmpPath], 4000);
            sentinelOutput = result.stdout || result.stderr;
          } catch (e: any) {
            sentinelFailed = true;
            console.error("Sognatore [WARNING]: Sentinel interceptor timed out or failed:", e.message);
            sentinelOutput = [e.stdout, e.stderr, e.message].filter(Boolean).join("\n");
            if (e.message?.includes("timed out") || e.signal === "SIGTERM") {
              timeoutReached = true;
            }
          } finally {
            await fs.unlink(tmpPath).catch(() => {});
          }

          // 4. Veto defensivo: fallo de proceso, timeout, salida CRITICAL/VETO, o exit implícito en catch
          if (sentinelFailed || sentinelOutputIndicatesVeto(sentinelOutput)) {
            const reason = timeoutReached
              ? "Sentinel execution timeout reached (4s) - Defensive Veto activated by default."
              : sentinelFailed
                ? "Sentinel execution failed or exited non-zero - Defensive Veto activated by default."
                : "Critical security pattern detected";
              
            await auditLog("SENTINEL_VETO", { tool: name, args, reason });
            recordVeto(name, "sentinel", mcpSessionId);
            return {
              content: [{ 
                type: "text", 
                text: `🛡️ [SENTINEL VETO ACTIVADO]\n\nSe ha bloqueado la ejecución de la herramienta '${name}' por violación de políticas de seguridad institucionales (Veto Defensivo Activado).\n\nDetalle:\n${reason}\n\nReporte del motor AST:\n${sentinelOutput || "Sin salida disponible."}` 
              }],
              isError: true,
            };
          }
        }
        // --- [FIN SENTINEL VETO] ---

        if (
          MCP_AMPLIFIER_TOOLS.some((t) => t.name === name) ||
          MCP_AMPLIFIER_READ_TOOLS.has(name) ||
          name === "enqueue_worker_job"
        ) {
          const result = await handleAmplifierTool(ROOT_PATH, name, args as Record<string, unknown>);
          return {
            content: [{ type: "text", text: result.text }],
            isError: result.isError,
          };
        }

        if (name === "get_swarm_telemetry") {
          try {
            const data = await fs.readFile(SWARM_STATE_PATH, "utf-8");
            return { content: [{ type: "text", text: data }] };
          } catch (e) {
            return { 
              content: [{ type: "text", text: "Error: No se pudo acceder al estado del enjambre." }],
              isError: true 
            };
          }
        }

        if (name === "read_audit_logs") {
          try {
            // Strict timeout of 2 seconds for this tool
            const readPromise = fs.readFile(AUDIT_LOG_PATH, "utf-8");
            const timeoutPromise = new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error("Timeout reading audit logs")), 2000)
            );
            let data = await Promise.race([readPromise, timeoutPromise]);
            
            // Limit output to the last 50 lines to prevent massive payload loops
            const lines = data.trim().split("\n");
            const lastLines = lines.slice(-50).join("\n");
            
            return { content: [{ type: "text", text: lastLines }] };
          } catch (e) {
            return { 
              content: [{ type: "text", text: `Error: No se pudo leer el archivo de auditoría. ${e instanceof Error ? e.message : String(e)}` }],
              isError: true 
            };
          }
        }

        if (name === "verify_sentinel_integrity") {
          try {
            const { stdout, stderr } = await runCommandWithTimeout("node", [SENTINEL_VETO_PATH], 30000); // 30 seconds user-requested timeout limit
            return { content: [{ type: "text", text: stdout || stderr }] };
          } catch (e: any) {
            if (e.signal === "SIGTERM") {
              return {
                content: [{ type: "text", text: "Error: La verificación de Sentinel superó el tiempo máximo de ejecución (30 segundos). Operación abortada para evitar bloqueos." }],
                isError: true
              };
            }
            return {
              content: [{ type: "text", text: `Error en la verificación de Sentinel: ${e.message}` }],
              isError: true
            };
          }
        }

        if (name === "update_swarm_mission") {
          // Robustez: Manejo de archivo inexistente o corrupto
          let currentData = {};
          try {
            const content = await fs.readFile(SWARM_STATE_PATH, "utf-8");
            currentData = JSON.parse(content);
          } catch (e) {
            console.warn("Iniciando nuevo estado de enjambre.");
          }

          const updatedData = { ...currentData, ...args };
          
          // Validación Zod (Estructura Atómica SSOT)
          try {
            const validated = SwarmStateSchema.parse(updatedData);
            await fs.writeFile(SWARM_STATE_PATH, JSON.stringify(validated, null, 2));
            return {
              content: [{ type: "text", text: "Mission updated and validated successfully." }],
            };
          } catch (zodError) {
            if (zodError instanceof z.ZodError) {
              const formattedIssues = zodError.issues.map(issue => `- [${issue.path.join(".")}] ${issue.message}`).join("\n");
              return {
                content: [{ type: "text", text: `Error de validación Zod en SSOT:\n${formattedIssues}` }],
                isError: true
              };
            }
            throw zodError;
          }
        }

        if (name === "get_sentinel_status") {
          try {
            const SIGNATURES_PATH = path.join(ROOT_PATH, "Sentinel", "data", "signatures.json");
            const fileInfo = await fs.stat(SIGNATURES_PATH);
            const content = await fs.readFile(SIGNATURES_PATH, "utf-8");
            const sigs = JSON.parse(content);
            const validSignaturesCount = Object.keys(sigs).length;

            let watcherActive = false;
            try {
              const cmd = process.platform === "win32" 
                ? 'wmic process where "name=\'node.exe\'" get CommandLine' 
                : 'ps aux | grep node';
              const { stdout } = await execAsync(cmd);
              if (stdout.includes("sentinel-watcher")) {
                watcherActive = true;
              }
            } catch (e) {
              watcherActive = true; // Fallback seguro
            }

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  status: "operational",
                  watcher_active: watcherActive,
                  signatures_count: validSignaturesCount,
                  db_size_bytes: fileInfo.size,
                  db_last_modified: fileInfo.mtime.toISOString(),
                  engine_path: SENTINEL_VETO_PATH
                }, null, 2)
              }]
            };
          } catch (e: any) {
            return {
              content: [{ type: "text", text: `Error al obtener estado de Sentinel: ${e.message}` }],
              isError: true
            };
          }
        }

        if (name === "get_memory_graph_telemetry") {
          try {
            const content = await fs.readFile(GRAPH_PATH, "utf-8");
            const parsed = JSON.parse(content);
            const nodes = parsed.nodes || [];
            const edges = parsed.edges || [];
            
            const node_count = nodes.length;
            const edge_count = edges.length;
            const density = node_count > 1 ? edge_count / (node_count * (node_count - 1)) : 0;
            
            const average_degree = node_count > 0 ? edge_count / node_count : 0;
            const entropy = 1 - density;

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  meta: {
                    ...parsed.meta,
                    calculated_at: new Date().toISOString()
                  },
                  metrics: {
                    node_count,
                    edge_count,
                    density,
                    average_degree,
                    entropy_score: entropy
                  }
                }, null, 2)
              }]
            };
          } catch (e: any) {
            return {
              content: [{ type: "text", text: `Error al obtener telemetría de UMA Graph: ${e.message}` }],
              isError: true
            };
          }
        }

        if (name === "run_synaptic_validation") {
          try {
            const content = await fs.readFile(GRAPH_PATH, "utf-8");
            const parsed = JSON.parse(content);
            const nodes = parsed.nodes || [];
            const edges = parsed.edges || [];
            
            const nodeIds = new Set(nodes.map((n: any) => n.id));
            const orphanEdges: any[] = [];
            const invalidNodes: any[] = [];
            
            nodes.forEach((n: any) => {
              if (!n.id || !n.label) {
                invalidNodes.push(n);
              }
            });

            edges.forEach((e: any) => {
              const sourceExists = nodeIds.has(e.source);
              const targetExists = nodeIds.has(e.target);
              if (!sourceExists || !targetExists) {
                orphanEdges.push({
                  edge: e,
                  missing: !sourceExists && !targetExists ? "both" : (!sourceExists ? "source" : "target")
                });
              }
            });

            const isolatedNodes: string[] = [];
            const connectedNodes = new Set<string>();
            edges.forEach((e: any) => {
              connectedNodes.add(e.source);
              connectedNodes.add(e.target);
            });
            nodes.forEach((n: any) => {
              if (!connectedNodes.has(n.id)) {
                isolatedNodes.push(n.id);
              }
            });

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  valid_nodes: nodes.length - invalidNodes.length,
                  invalid_nodes_count: invalidNodes.length,
                  orphaned_edges_count: orphanEdges.length,
                  isolated_nodes_count: isolatedNodes.length,
                  orphaned_edges: orphanEdges,
                  isolated_nodes: isolatedNodes,
                  integrity_status: orphanEdges.length === 0 && invalidNodes.length === 0 ? "healthy" : "corrupted"
                }, null, 2)
              }]
            };
          } catch (e: any) {
            return {
              content: [{ type: "text", text: `Error en validación sináptica: ${e.message}` }],
              isError: true
            };
          }
        }

        if (name === "run_consolidation_pipeline") {
          try {
            // Invocar el endpoint /memory/consolidate del UMA Resident Server (port 8080)
            const result = await new Promise<{ status: string; results?: any; error?: string }>((resolve) => {
              const req = http.request(
                {
                  hostname: "127.0.0.1",
                  port: 8080,
                  path: "/memory/consolidate",
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                },
                (res) => {
                  let body = "";
                  res.on("data", (chunk) => { body += chunk; });
                  res.on("end", () => {
                    try {
                      const parsed = JSON.parse(body);
                      resolve(parsed);
                    } catch {
                      resolve({ status: res.statusCode === 200 ? "success" : "error", error: body });
                    }
                  });
                }
              );
              req.on("error", (err) => {
                resolve({ status: "error", error: `UMA Server no disponible en puerto 8080: ${err.message}. Ejecute 'sogna up' primero.` });
              });
              req.write(JSON.stringify({}));
              req.end();
            });

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  pipeline: "Synaptic Consolidation (3 phases)",
                  timestamp: new Date().toISOString(),
                  ...result
                }, null, 2)
              }]
            };
          } catch (e: any) {
            return {
              content: [{ type: "text", text: `Error al ejecutar pipeline de consolidación: ${e.message}` }],
              isError: true
            };
          }
        }

        throw new Error(`Tool not found: ${name}`);
      })();

      const rawResult = await Promise.race([executePromise, timeoutPromise]);
      if (rawResult && Array.isArray(rawResult.content)) {
        rawResult.content = rawResult.content.map((item: any) => {
          if (item.type === "text" && typeof item.text === "string") {
            return { ...item, text: sanitizeOutputText(item.text) };
          }
          return item;
        });
      }
      const isError = Boolean((rawResult as { isError?: boolean })?.isError);
      recordToolResult(
        name,
        Date.now() - t0,
        !isError,
        mcpSessionId,
        isError ? "tool_error" : undefined,
      );
      return rawResult;
    } catch (error) {
      const errorText = `Error en herramienta institucional: ${error instanceof Error ? error.message : String(error)}`;
      recordToolResult(name, Date.now() - t0, false, mcpSessionId, errorText.slice(0, 120));
      return {
        content: [{ type: "text", text: sanitizeOutputText(errorText) }],
        isError: true,
      };
    }
  });

  return server;
}

interface Session {
  transport: SSEServerTransport;
  server: Server;
  req: express.Request;
  lastActive: number;
}

const app = express();
const MCP_HOST = (process.env.SOGNA_MCP_HOST || "127.0.0.1").trim() || "127.0.0.1";
const MCP_PORT = Math.max(
  1,
  parseInt(process.env.SOGNA_MCP_BRIDGE_PORT || process.env.PORT || "8001", 10) || 8001,
);
app.use(
  cors({
    origin: [`http://127.0.0.1:${MCP_PORT}`, `http://localhost:${MCP_PORT}`],
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
const jsonBodyParser = express.json({ limit: "1mb" });
// /message debe recibir el body sin parsear: handlePostMessage lee el stream crudo (MCP SSE).
app.use((req, res, next) => {
  if (req.path === "/message") {
    next();
    return;
  }
  jsonBodyParser(req, res, next);
});
const transports = new Map<string, Session>();

app.get("/health", (_req, res) => {
  const sseLegacy = transports.size;
  const streamable = getStreamableSessionCount();
  const metrics = getMcpMetrics(sseLegacy, streamable);
  res.json({
    status: "ok",
    service: "sognatore-mcp-bridge",
    uptime_s: Math.round(process.uptime()),
    active_sessions: sseLegacy + streamable,
    transports: {
      sse_legacy: sseLegacy,
      streamable_http: streamable,
    },
    mcp: {
      tool_calls_total: metrics.tool_calls_total,
      tool_errors_total: metrics.tool_errors_total,
      vetoes_total: metrics.vetoes_total,
    },
  });
});

app.get("/metrics", (_req, res) => {
  res.json(getMcpMetrics(transports.size, getStreamableSessionCount()));
});

app.get("/mcp-stack", async (_req, res) => {
  const umaApiPort = process.env.SOGNA_UMA_API_PORT || "8080";
  const mcpUmaPort = process.env.SOGNA_MCP_UMA_PORT || "8000";
  const origin = `http://${MCP_HOST}`;

  async function probe(url: string): Promise<{
    url: string;
    ok: boolean;
    status?: number;
    error?: string;
  }> {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      return { url, ok: r.status >= 200 && r.status < 400, status: r.status };
    } catch (e) {
      return {
        url,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  const claudePath = path.join(ROOT_PATH, "CLAUDE.md");
  const agentsPath = path.join(ROOT_PATH, "Curator", "agents");
  const bridgeReady = existsSync(claudePath) && existsSync(agentsPath);
  const metrics = getMcpMetrics(transports.size, getStreamableSessionCount());

  const [umaApi, mcpUmaSse] = await Promise.all([
    probe(`${origin}:${umaApiPort}/health`),
    probe(`${origin}:${mcpUmaPort}/sse`),
  ]);

  res.json({
    ts: new Date().toISOString(),
    policy: {
      allow_write: process.env.SOGNA_MCP_ALLOW_WRITE === "1",
      delegate_token: Boolean(process.env.SOGNA_DELEGATE_API_TOKEN),
      mcp_token: isMcpAuthEnabled(),
    },
    services: {
      uma_api: { port: Number(umaApiPort), ...umaApi },
      uma_mcp: { port: Number(mcpUmaPort), ...mcpUmaSse },
      sognatore_bridge: {
        port: MCP_PORT,
        ok: true,
        status: 200,
        ready: bridgeReady,
        active_sessions: transports.size + getStreamableSessionCount(),
      },
    },
    metrics,
  });
});

app.get("/ready", (_req, res) => {
  const claudePath = path.join(ROOT_PATH, "CLAUDE.md");
  const agentsPath = path.join(ROOT_PATH, "Curator", "agents");
  const ready = existsSync(claudePath) && existsSync(agentsPath);
  res.status(ready ? 200 : 503).json({
    ready,
    sogna_root: ROOT_PATH,
    checks: {
      claude_md: existsSync(claudePath),
      curator_agents: existsSync(agentsPath),
    },
  });
});

app.use("/api", requireDelegateApiToken);
mountDelegateApi(app, ROOT_PATH);
app.use("/dashboard", express.static(path.join(ROOT_PATH, "control", "dashboard")));

// --- Circuit Breaker para bucles de conexión SSE ---
const connectionHistory: number[] = [];
const MAX_CONNECTIONS_WINDOW_MS = 10000; // 10 segundos
const MAX_CONNECTIONS_THRESHOLD = 8; // Máximo 8 conexiones en 10s

app.post("/sse", async (req, res) => {
  if (!requireMcpToken(req, res)) return;
  await createStreamablePostHandler(createMcpServer)(req, res);
});

app.get("/sse", async (req, res) => {
  if (!requireMcpToken(req, res)) return;
  if (await tryHandleStreamableGet(req, res)) {
    return;
  }

  const now = Date.now();
  // Limpiar historial antiguo
  while (connectionHistory.length > 0 && connectionHistory[0] < now - MAX_CONNECTIONS_WINDOW_MS) {
    connectionHistory.shift();
  }
  
  connectionHistory.push(now);
  
  if (connectionHistory.length > MAX_CONNECTIONS_THRESHOLD) {
    recordCircuitBreakerTrip();
    console.error(`🛡️ [CIRCUIT BREAKER] Bucle de conexión detectado en SSE. Rejecting request.`);
    if (!res.headersSent) {
      res.status(429).send("Too Many Connection Requests - Circuit Breaker Activated to Prevent Infinite Loops");
    }
    return;
  }

  let activeTransport: SSEServerTransport | null = null;
  let sessionServer: Server | null = null;
  let sessionId: string | null = null;

  try {
    activeTransport = new SSEServerTransport("/message", res);
    sessionId = activeTransport.sessionId;
    sessionServer = createMcpServer(sessionId);
    
    const sessionObj: Session = {
      transport: activeTransport,
      server: sessionServer,
      req,
      lastActive: Date.now()
    };
    transports.set(sessionId, sessionObj);

    req.on("close", async () => {
      console.error(`Sognatore: SSE connection closed by client for session ${sessionId}`);
      if (sessionId) transports.delete(sessionId);
      try {
        if (activeTransport) await activeTransport.close();
      } catch (e) {
        // Ignore transport close errors
      }
      try {
        if (sessionServer) await sessionServer.close();
      } catch (e) {
        // Ignore server close errors
      }
    });

    await sessionServer.connect(activeTransport);
    recordSseConnection();
    console.error(`Sognatore: Client connected via SSE (Session: ${sessionId})`);
  } catch (error) {
    console.error("Sognatore: Error in /sse connection:", error);
    if (sessionId) transports.delete(sessionId);
    try {
      if (activeTransport) await activeTransport.close();
    } catch (e) {}
    try {
      if (sessionServer) await sessionServer.close();
    } catch (e) {}
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error on SSE connection");
    }
  }
});

app.post("/message", async (req, res) => {
  if (!requireMcpToken(req, res)) return;
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send("Missing sessionId parameter");
      return;
    }
    const session = transports.get(sessionId);
    if (session) {
      session.lastActive = Date.now(); // Actualizar actividad
      await session.transport.handlePostMessage(req, res);
    } else {
      res.status(404).send(`Session not found: ${sessionId}`);
    }
  } catch (error) {
    console.error("Sognatore: Error in /message handler:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error on message routing");
    }
  }
});

// --- GARBAGE COLLECTOR PARA SESIONES HUÉRFANAS O ZOMBIS ---
const IDLE_SESSION_TIMEOUT_MS = 120000; // 2 minutos sin actividad
const CHECK_INTERVAL_MS = 30000; // Cada 30 segundos

setInterval(async () => {
  const now = Date.now();
  for (const [sessionId, session] of transports.entries()) {
    const isSocketDestroyed = session.req.socket?.destroyed || session.req.destroyed;
    const isIdle = now - session.lastActive > IDLE_SESSION_TIMEOUT_MS;
    
    if (isSocketDestroyed || isIdle) {
      const reason = isSocketDestroyed ? "Socket destroyed" : "Session idle timeout";
      console.warn(`[GARBAGE COLLECTOR] Cleaning up zombie session ${sessionId}. Reason: ${reason}`);
      transports.delete(sessionId);
      try {
        await session.transport.close();
      } catch (e) {}
      try {
        await session.server.close();
      } catch (e) {}
    }
  }
  const streamableRemoved = await cleanupStreamableSessions(IDLE_SESSION_TIMEOUT_MS);
  if (streamableRemoved > 0) {
    console.warn(`[GARBAGE COLLECTOR] Streamable sessions cleaned: ${streamableRemoved}`);
  }
}, CHECK_INTERVAL_MS);

// --- ENDPOINTS DASHBOARD TELEMETRÍA ---
app.get("/telemetry", async (req, res) => {
  try {
    const data = await fs.readFile(SWARM_STATE_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "No se pudo acceder al estado del enjambre." });
  }
});

app.get("/audit-logs", async (req, res) => {
  try {
    const data = await fs.readFile(AUDIT_LOG_PATH, "utf-8");
    const logs = data.trim().split("\n").map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: "No se pudo acceder a los logs de auditoría." });
  }
});

app.get("/sentinel-status", async (req, res) => {
  try {
    const SIGNATURES_PATH = path.join(ROOT_PATH, "Sentinel", "data", "signatures.json");
    const fileInfo = await fs.stat(SIGNATURES_PATH);
    const content = await fs.readFile(SIGNATURES_PATH, "utf-8");
    const sigs = JSON.parse(content);
    const validSignaturesCount = Object.keys(sigs).length;

    let watcherActive = false;
    try {
      const cmd = process.platform === "win32" 
        ? 'wmic process where "name=\'node.exe\'" get CommandLine' 
        : 'ps aux | grep node';
      const { stdout } = await execAsync(cmd);
      if (stdout.includes("sentinel-watcher")) {
        watcherActive = true;
      }
    } catch (e) {
      watcherActive = true; // Fallback seguro
    }

    res.json({
      status: "operational",
      watcher_active: watcherActive,
      signatures_count: validSignaturesCount,
      db_size_bytes: fileInfo.size,
      db_last_modified: fileInfo.mtime.toISOString(),
      engine_path: SENTINEL_VETO_PATH
    });
  } catch (e: any) {
    res.status(500).json({ error: `Error al obtener estado de Sentinel: ${e.message}` });
  }
});

app.get("/graph-telemetry", async (req, res) => {
  try {
    const content = await fs.readFile(GRAPH_PATH, "utf-8");
    const parsed = JSON.parse(content);
    const nodes = parsed.nodes || [];
    const edges = parsed.edges || [];
    
    const node_count = nodes.length;
    const edge_count = edges.length;
    const density = node_count > 1 ? edge_count / (node_count * (node_count - 1)) : 0;
    
    const average_degree = node_count > 0 ? edge_count / node_count : 0;
    const entropy = 1 - density;

    res.json({
      meta: {
        ...parsed.meta,
        calculated_at: new Date().toISOString()
      },
      metrics: {
        node_count,
        edge_count,
        density,
        average_degree,
        entropy_score: entropy
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: `Error al obtener telemetría de UMA Graph: ${e.message}` });
  }
});

async function main() {
  app.listen(MCP_PORT, MCP_HOST, () => {
    console.error(`[SISTEMA] SOGNA_ROOT: ${ROOT_PATH}`);
    console.error(`[SISTEMA] Sognatore MCP Server running on SSE at http://${MCP_HOST}:${MCP_PORT}`);
    console.error(`[SISTEMA] SSE endpoint: http://${MCP_HOST}:${MCP_PORT}/sse`);
    console.error(`[SISTEMA] Message endpoint: http://${MCP_HOST}:${MCP_PORT}/message`);
    console.error(`[SISTEMA] Delegate API: http://${MCP_HOST}:${MCP_PORT}/api/agents`);
  });
}

main().catch((error) => {
  console.error("Fatal error in Sognatore:", error);
  process.exit(1);
});
