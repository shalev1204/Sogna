import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import express from "express";
import { z } from "zod";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import ts from "typescript";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper simple para resolver la raíz de Sogna sin depender de imports cruzados
function resolveRoot(startDir: string = __dirname): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const rc = path.join(dir, ".sognarc.json");
    if (existsSync(rc)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback a subir niveles fijos si no encuentra .sognarc.json
  return path.resolve(startDir, "../../../../../");
}

const ROOT_PATH = resolveRoot();
const SENTINEL_DIR = path.join(ROOT_PATH, "Sentinel");
const PREDATORE_DIR = path.join(ROOT_PATH, "Predatore");

console.error(`[SENTINEL-MCP] Resolviendo rutas del sistema:`);
console.error(`  - Root: ${ROOT_PATH}`);
console.error(`  - Sentinel: ${SENTINEL_DIR}`);
console.error(`  - Predatore: ${PREDATORE_DIR}`);

// Inicializar el servidor Express
const app = express();

// Opciones CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

const jsonBodyParser = express.json({ limit: "1mb" });
// /message debe recibir el body sin parsear: handlePostMessage lee el stream crudo (MCP SSE).
app.use((req, res, next) => {
  if (req.path === "/message") {
    next();
    return;
  }
  jsonBodyParser(req, res, next);
});

// Definir Zod schemas para los argumentos
const ScanCodeSchema = z.object({
  targetPath: z.string().optional().describe("Ruta opcional a auditar relativa a la raíz. Si se omite, audita todo el monorepo."),
});

const CommandVetoSchema = z.object({
  command: z.string().describe("El comando de shell completo a validar."),
});

const HealCodeSchema = z.object({
  filePath: z.string().describe("Ruta absoluta o relativa al archivo que se desea reparar."),
  errorDetails: z.string().optional().describe("Detalles del linter, compilador o vulnerabilidad para guiar la autocuración."),
  type: z.enum(["casing", "imports", "types", "generic"]).default("generic").describe("Tipo de reparación específica a ejecutar."),
});

const RunPentestSchema = z.object({
  url: z.string().describe("URL del objetivo para el análisis dinámico de vulnerabilidades."),
  workspace: z.string().optional().describe("Nombre personalizado para el workspace del pentest."),
});

const GetReportSchema = z.object({
  workspace: z.string().describe("Nombre del workspace o identificador del scan del cual recuperar el reporte."),
});

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // 1. Priorizar Ollama local
  try {
    const tagsRes = await fetch("http://127.0.0.1:11434/api/tags");
    if (tagsRes.ok) {
      const tagsData = (await tagsRes.json()) as any;
      const models = (tagsData.models || []).map((m: any) => m.name);
      console.error(`[SENTINEL-LLM] Modelos Ollama detectados:`, models);
      
      let selectedModel = "";
      const preferences = [
        "qwen2.5-coder",
        "deepseek-coder",
        "coder",
        "llama3.1",
        "llama3",
        "gemma2",
        "gemma"
      ];
      
      for (const pref of preferences) {
        const found = models.find((m: string) => m.toLowerCase().includes(pref));
        if (found) {
          selectedModel = found;
          break;
        }
      }
      
      if (!selectedModel && models.length > 0) {
        selectedModel = models[0];
      }
      
      if (!selectedModel) {
        selectedModel = "qwen2.5-coder:7b";
      }
      
      console.error(`[SENTINEL-LLM] Usando modelo Ollama: ${selectedModel}`);
      
      const chatRes = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          options: { temperature: 0.1 },
          stream: false
        })
      });
      
      if (chatRes.ok) {
        const chatData = (await chatRes.json()) as any;
        if (chatData?.message?.content) {
          return chatData.message.content;
        }
      }
      console.error(`[SENTINEL-LLM] Falló la petición a /api/chat en Ollama. Status: ${chatRes.status}`);
    }
  } catch (e: any) {
    console.error(`[SENTINEL-LLM] Ollama local no disponible o falló: ${e.message}`);
  }

  // Helper para validar keys
  const isValidKey = (k: string | undefined) => k && k.trim() && !k.includes("YOUR_") && !k.includes("PLACEHOLDER");

  // 2. Fallback a Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (isValidKey(geminiKey)) {
    console.error("[SENTINEL-LLM] Fallback: Usando API de Gemini");
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: { temperature: 0.1 }
        })
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
      console.error(`[SENTINEL-LLM] Gemini API falló con status: ${res.status}`);
    } catch (e: any) {
      console.error(`[SENTINEL-LLM] Error en Gemini: ${e.message}`);
    }
  }

  // 3. Fallback a OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (isValidKey(openaiKey)) {
    console.error("[SENTINEL-LLM] Fallback: Usando API de OpenAI");
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1
        })
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
      console.error(`[SENTINEL-LLM] OpenAI API falló con status: ${res.status}`);
    } catch (e: any) {
      console.error(`[SENTINEL-LLM] Error en OpenAI: ${e.message}`);
    }
  }

  // 4. Fallback a Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (isValidKey(anthropicKey)) {
    console.error("[SENTINEL-LLM] Fallback: Usando API de Anthropic");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.1
        })
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.content?.[0]?.text;
        if (text) return text;
      }
      console.error(`[SENTINEL-LLM] Anthropic API falló con status: ${res.status}`);
    } catch (e: any) {
      console.error(`[SENTINEL-LLM] Error en Anthropic: ${e.message}`);
    }
  }

  throw new Error("No hay proveedores de LLM disponibles (Ollama local inaccesible y no hay llaves de API de nube válidas en el entorno).");
}

function extractCodeBlock(markdown: string): string {
  const match = markdown.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/);
  if (match) {
    return match[1];
  }
  return markdown;
}

function checkTypeScriptSyntax(content: string, filename: string): { ok: boolean; error?: string } {
  try {
    const sourceFile = ts.createSourceFile(
      filename,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    const diagnostics = (sourceFile as any).parseDiagnostics || [];
    if (diagnostics.length > 0) {
      const messages = diagnostics.map((d: any) => {
        const message = typeof d.messageText === "string" ? d.messageText : d.messageText.messageText;
        const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
        return `Línea ${pos.line + 1}, Columna ${pos.character + 1}: ${message}`;
      });
      return { ok: false, error: messages.join("\n") };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function validateCodeSyntax(tempFile: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const ext = path.extname(tempFile);
  if (ext === ".py") {
    try {
      await execAsync(`python3 -m py_compile "${tempFile}"`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.stderr || e.stdout || e.message };
    }
  } else if (ext === ".js" || ext === ".ts" || ext === ".tsx" || ext === ".jsx") {
    return checkTypeScriptSyntax(content, tempFile);
  }
  return { ok: true };
}

// Fábrica de servidores MCP por sesión para evitar colisiones
function createMcpServer(sessionId?: string): Server {
  const server = new Server(
    {
      name: "Sentinel-MCP",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Implementar el listado de herramientas
  server.setRequestHandler(z.object({ method: z.literal("tools/list") }), async () => {
    return {
      tools: [
        {
          name: "sentinel_scan_code",
          description: "Ejecuta el escáner antivirus y auditoría de seguridad estática de Sentinel sobre el código fuente y dependencias.",
          inputSchema: {
            type: "object",
            properties: {
              targetPath: { type: "string", description: "Ruta opcional a auditar" }
            }
          }
        },
        {
          name: "sentinel_command_veto",
          description: "Valida de manera determinista un comando de shell contra las políticas de seguridad de Sentinel antes de su ejecución.",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string", description: "Comando de shell completo" }
            },
            required: ["command"]
          }
        },
        {
          name: "sentinel_heal_code",
          description: "Aplica parches automáticos de seguridad y corrige fallos estructurales (casing, imports, tipos) en el código fuente.",
          inputSchema: {
            type: "object",
            properties: {
              filePath: { type: "string", description: "Ruta del archivo a curar" },
              errorDetails: { type: "string", description: "Detalles del error o vulnerabilidad" },
              type: { type: "string", enum: ["casing", "imports", "types", "generic"], description: "Tipo de reparación" }
            },
            required: ["filePath"]
          }
        },
        {
          name: "predatore_run_pentest",
          description: "Lanza el pipeline dinámico de pentesting (recon, vulnerabilidades y exploits en Docker) usando Predatore.",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL del objetivo" },
              workspace: { type: "string", description: "Nombre de workspace opcional" }
            },
            required: ["url"]
          }
        },
        {
          name: "predatore_get_status",
          description: "Obtiene el estado de los escaneos de pentesting y enumera los workspaces activos de Predatore.",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "predatore_get_report",
          description: "Recupera el informe de vulnerabilidades final generado para un escaneo específico de Predatore.",
          inputSchema: {
            type: "object",
            properties: {
              workspace: { type: "string", description: "Identificador del scan / workspace" }
            },
            required: ["workspace"]
          }
        }
      ]
    };
  });

  // Resolver llamadas de herramientas
  server.setRequestHandler(z.object({
    method: z.literal("tools/call"),
    params: z.object({
      name: z.string(),
      arguments: z.record(z.any()).optional(),
    }),
  }), async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case "sentinel_scan_code": {
          const parsed = ScanCodeSchema.parse(args);
          const target = parsed.targetPath ? path.resolve(ROOT_PATH, parsed.targetPath) : ROOT_PATH;
          
          console.error(`[SENTINEL-MCP] [Sesión: ${sessionId}] Ejecutando escaneo de código en: ${target}`);
          
          const auditScript = path.join(SENTINEL_DIR, "sentinel-audit.py");
          const doctorScript = path.join(SENTINEL_DIR, "Sentinel-doctor.py");
          
          let auditOut = "";
          let doctorOut = "";
          let hasError = false;

          try {
            const { stdout, stderr } = await execAsync(`python3 "${auditScript}" "${target}"`);
            auditOut = stdout + (stderr ? `\nSTDERR: ${stderr}` : "");
          } catch (e: any) {
            hasError = true;
            auditOut = (e.stdout || "") + "\nERROR: " + e.message;
          }

          try {
            const { stdout, stderr } = await execAsync(`python3 "${doctorScript}" "${target}"`);
            doctorOut = stdout + (stderr ? `\nSTDERR: ${stderr}` : "");
          } catch (e: any) {
            doctorOut = (e.stdout || "") + "\nERROR: " + e.message;
          }

          return {
            content: [
              {
                type: "text",
                text: `=== AUDITORÍA DE SEGURIDAD SENTINEL ===\n\n${auditOut}\n\n=== DIAGNÓSTICO DOCTOR SENTINEL ===\n\n${doctorOut}`
              }
            ],
            isError: hasError
          };
        }

        case "sentinel_command_veto": {
          const parsed = CommandVetoSchema.parse(args);
          const vetoScript = path.join(SENTINEL_DIR, "bin", "sentinel-veto.js");
          
          const tmpPath = path.join(ROOT_PATH, "memory", "operational", "logs", `veto_mcp_${Date.now()}.json`);
          await fs.mkdir(path.dirname(tmpPath), { recursive: true });
          await fs.writeFile(tmpPath, JSON.stringify({ tool: "shell_execute", args: { command: parsed.command } }, null, 2));

          let passed = true;
          let output = "";
          try {
            const { stdout, stderr } = await execAsync(`node "${vetoScript}" "${tmpPath}"`);
            output = stdout + (stderr ? `\n${stderr}` : "");
          } catch (e: any) {
            passed = false;
            output = (e.stdout || "") + "\n" + (e.stderr || "") + "\nERROR: " + e.message;
          } finally {
            await fs.unlink(tmpPath).catch(() => {});
          }

          return {
            content: [
              {
                type: "text",
                text: `=== RESULTADO VETO SENTINEL ===\nEstado: ${passed ? "AUTORIZADO" : "VETO INYECTADO (BLOQUEADO)"}\n\nReporte del análisis:\n${output}`
              }
            ],
            isError: !passed
          };
        }

        case "sentinel_heal_code": {
          const parsed = HealCodeSchema.parse(args);
          const resolvedPath = path.resolve(ROOT_PATH, parsed.filePath);

          if (!existsSync(resolvedPath)) {
            return {
              content: [{ type: "text", text: `Error: El archivo no existe en la ruta: ${resolvedPath}` }],
              isError: true
            };
          }

          let isDeterminismApplied = false;
          let determinismResult = "";

          if (parsed.type === "casing" || parsed.type === "imports" || parsed.type === "types") {
            const surgeonName = `repair-${parsed.type === "casing" ? "casing" : parsed.type === "imports" ? "imports" : "types"}.py`;
            const surgeonScript = path.join(SENTINEL_DIR, "surgeons", surgeonName);
            
            if (existsSync(surgeonScript)) {
              console.error(`[SENTINEL-MCP] Aplicando cirujano determinista: ${surgeonName}`);
              try {
                const { stdout, stderr } = await execAsync(`python3 "${surgeonScript}" "${resolvedPath}"`);
                isDeterminismApplied = true;
                determinismResult = `Cirujano ${parsed.type} aplicado con éxito.\nSalida:\n${stdout}\n${stderr}`;
              } catch (e: any) {
                console.error(`[SENTINEL-MCP] Cirujano determinista falló: ${e.message}. Relegando a autocuración genérica.`);
                determinismResult = `Error al ejecutar el cirujano determinista: ${e.message}\nSalida:\n${e.stdout}\n${e.stderr}\n\n`;
              }
            } else {
              console.error(`[SENTINEL-MCP] Cirujano ${surgeonName} no existe. Relegando a autocuración genérica.`);
              determinismResult = `Cirujano ${surgeonName} no encontrado en surgeons/.\n\n`;
            }
          }

          if (isDeterminismApplied) {
            return {
              content: [{ type: "text", text: determinismResult }]
            };
          }

          console.error(`[SENTINEL-MCP] Intentando autocuración inteligente asistida por LLM para: ${resolvedPath}`);
          
          try {
            const originalCode = await fs.readFile(resolvedPath, "utf-8");
            
            const systemPrompt = `Eres Sentinel Autocuración, una IA experta en depuración y seguridad. Tu tarea es analizar el código fuente proporcionado, corregir el error o vulnerabilidad descrita, y devolver el código fuente completo corregido. No debes alterar la funcionalidad legítima.
IMPORTANTE: Devuelve ÚNICAMENTE el código fuente corregido dentro de un bloque de código markdown de la forma \`\`\`[lenguaje]\n[código]\n\`\`\`. No des explicaciones de texto fuera del bloque de código.`;
            
            const userPrompt = `Archivo: ${parsed.filePath}
Detalles del error/vulnerabilidad: ${parsed.errorDetails || "Reparar fallos generales de sintaxis, imports o tipos."}

Código fuente original:
\`\`\`
${originalCode}
\`\`\``;

            console.error(`[SENTINEL-MCP] Invocando callLLM...`);
            const llmResponse = await callLLM(systemPrompt, userPrompt);
            const newCode = extractCodeBlock(llmResponse);
            
            // 2. Validación en Sandbox
            const tempDir = path.join(ROOT_PATH, "memory", "operational", "logs");
            await fs.mkdir(tempDir, { recursive: true });
            const ext = path.extname(resolvedPath);
            const tempFile = path.join(tempDir, `heal_sandbox_${Date.now()}${ext}`);
            
            await fs.writeFile(tempFile, newCode, "utf-8");
            console.error(`[SENTINEL-MCP] Validando código curado en sandbox temporal: ${tempFile}`);
            
            const validation = await validateCodeSyntax(tempFile, newCode);
            if (validation.ok) {
              console.error(`[SENTINEL-MCP] Validación exitosa. Sobrescribiendo archivo original: ${resolvedPath}`);
              await fs.writeFile(resolvedPath, newCode, "utf-8");
              
              // Opcional: linter run
              let linterResult = "";
              try {
                if (resolvedPath.endsWith(".ts") || resolvedPath.endsWith(".js")) {
                  await execAsync(`npx eslint --fix "${resolvedPath}"`);
                  linterResult = "\nSe ejecutó ESLint --fix sobre el archivo curado.";
                }
              } catch (lintErr: any) {
                linterResult = `\nESLint --fix ejecutado tras curación. Lints residuales:\n${lintErr.stdout || lintErr.message}`;
              }
              
              return {
                content: [{
                  type: "text",
                  text: `${determinismResult}Autocuración inteligente exitosa. El archivo fue validado en el sandbox y sobrescrito correctamente.${linterResult}`
                }]
              };
            } else {
              console.error(`[SENTINEL-MCP] Falló la validación del código autocurado. Abortando reemplazo.`);
              return {
                content: [{
                  type: "text",
                  text: `${determinismResult}Error de validación sintáctica en el código generado por el LLM. Reemplazo abortado para proteger la integridad del sistema.\n\nDetalles del error del compilador:\n${validation.error}\n\nEl archivo temporal del sandbox se conservó en: ${tempFile}`
                }],
                isError: true
              };
            }
          } catch (err: any) {
            console.error(`[SENTINEL-MCP] Error durante autocuración: ${err.message}`);
            return {
              content: [{
                type: "text",
                text: `${determinismResult}Fallo crítico durante el flujo de autocuración: ${err.message}`
              }],
              isError: true
            };
          }
        }

        case "predatore_run_pentest": {
          const parsed = RunPentestSchema.parse(args);
          const predatoreBin = path.join(PREDATORE_DIR, "predatore");
          const workspaceName = parsed.workspace || `mcp_audit_${Date.now()}`;
          
          console.error(`[SENTINEL-MCP] Lanzando auditoría dinámica de Predatore en background...`);
          console.error(`  - URL: ${parsed.url}`);
          console.error(`  - Workspace: ${workspaceName}`);

          const child = spawn(
            "node",
            [predatoreBin, "start", "-u", parsed.url, "-r", ROOT_PATH, "-w", workspaceName],
            {
              cwd: PREDATORE_DIR,
              detached: true,
              stdio: "ignore",
              env: { ...process.env, PREDATORE_LOCAL: "1" }
            }
          );
          child.unref();

          return {
            content: [
              {
                type: "text",
                text: `🚀 Pentesting iniciado en segundo plano para: ${parsed.url}\nID de Workspace: ${workspaceName}\n\nPuede consultar el progreso de la auditoría llamando a 'predatore_get_status'.`
              }
            ]
          };
        }

        case "predatore_get_status": {
          const predatoreBin = path.join(PREDATORE_DIR, "predatore");
          
          let stdout = "";
          let stderr = "";
          try {
            const res = await execAsync(`node "${predatoreBin}" workspaces`, { cwd: PREDATORE_DIR });
            stdout = res.stdout;
            stderr = res.stderr;
          } catch (e: any) {
            stdout = e.stdout || "";
            stderr = e.stderr || e.message;
          }

          let runningWorkers = "";
          try {
            const res = await execAsync(`node "${predatoreBin}" status`, { cwd: PREDATORE_DIR });
            runningWorkers = res.stdout;
          } catch (e: any) {
            runningWorkers = `No se pudo obtener el estado de los workers de Temporal: ${e.message}`;
          }

          return {
            content: [
              {
                type: "text",
                text: `=== WORKSPACES DE PREDATORE ===\n${stdout || "Sin workspaces activos."}\n${stderr ? `\nErrores:\n${stderr}` : ""}\n\n=== ESTADO DE WORKERS (TEMPORAL) ===\n${runningWorkers}`
              }
            ]
          };
        }

        case "predatore_get_report": {
          const parsed = GetReportSchema.parse(args);
          const targetDir = path.join(PREDATORE_DIR, "workspaces");
          let reportContent = "No se encontró ningún reporte ejecutivo generado para el workspace especificado.\nAsegúrese de que el escaneo haya finalizado completamente.";
          
          try {
            const dirs = await fs.readdir(targetDir);
            const match = dirs.find(d => d.includes(parsed.workspace));
            if (match) {
              const reportPath = path.join(targetDir, match, "deliverables", "report.md");
              if (existsSync(reportPath)) {
                reportContent = await fs.readFile(reportPath, "utf-8");
              } else {
                const alternativePath = path.join(targetDir, match, "session.json");
                if (existsSync(alternativePath)) {
                  const session = JSON.parse(await fs.readFile(alternativePath, "utf-8"));
                  reportContent = `El pentest sigue en progreso o falló.\nEstado de sesión:\n${JSON.stringify(session, null, 2)}`;
                }
              }
            }
          } catch (e: any) {
            reportContent = `Error al buscar el reporte en workspaces: ${e.message}`;
          }

          return {
            content: [{ type: "text", text: reportContent }]
          };
        }

        default:
          throw new Error(`Herramienta no implementada: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error de ejecución: ${error.message}` }],
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

interface StreamableSession {
  transport: StreamableHTTPServerTransport;
  server: Server;
  lastActive: number;
}

const activeTransports = new Map<string, Session>();
const streamableSessions = new Map<string, StreamableSession>();

// Autorización opcional por token
function verifyMcpToken(req: express.Request): boolean {
  const expected = process.env.SOGNA_MCP_TOKEN?.trim();
  if (!expected) return true;

  const header = req.headers.authorization;
  if (header === `Bearer ${expected}`) return true;

  const queryToken = req.query.token;
  if (typeof queryToken === "string" && queryToken === expected) return true;

  return false;
}

function requireMcpToken(req: express.Request, res: express.Response): boolean {
  if (verifyMcpToken(req)) return true;
  if (!res.headersSent) {
    res.status(401).json({
      error:
        "Unauthorized MCP — configure SOGNA_MCP_TOKEN en el servidor y token en la URL del cliente (?token=) o Authorization: Bearer",
    });
  }
  return false;
}

// Rutas de administración y salud
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", server: "Sentinel-MCP", sessions: activeTransports.size + streamableSessions.size });
});

app.get("/ready", (_req, res) => {
  const ready = existsSync(path.join(SENTINEL_DIR, "sentinel-audit.py")) && existsSync(path.join(PREDATORE_DIR, "predatore"));
  res.status(ready ? 200 : 503).json({ ready });
});

app.post("/message", async (req, res) => {
  if (!requireMcpToken(req, res)) return;
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send("Missing sessionId parameter");
      return;
    }
    const session = activeTransports.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await session.transport.handlePostMessage(req, res);
    } else {
      res.status(404).send(`Session not found: ${sessionId}`);
    }
  } catch (error: any) {
    console.error("[SENTINEL-MCP] Error in /message handler:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error on message routing");
    }
  }
});

// Streamable HTTP POST /sse
app.post("/sse", async (req, res) => {
  if (!requireMcpToken(req, res)) return;
  try {
    const sessionHeader = req.headers["mcp-session-id"];
    const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;

    if (sessionId && streamableSessions.has(sessionId)) {
      const session = streamableSessions.get(sessionId)!;
      session.lastActive = Date.now();
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (sid) => {
          streamableSessions.set(sid, {
            transport,
            server,
            lastActive: Date.now(),
          });
        },
      });

      await server.connect(transport);

      transport.onclose = async () => {
        const sid = transport.sessionId;
        if (sid) streamableSessions.delete(sid);
        try {
          await server.close();
        } catch {
          // ignore
        }
      };

      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!res.headersSent) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: invalid streamable session" },
        id: null,
      });
    }
  } catch (error: any) {
    console.error("[SENTINEL-MCP] Streamable HTTP POST /sse error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/sse", async (req, res) => {
  if (!requireMcpToken(req, res)) return;

  // Intentar atender transporte Streamable HTTP (GET /sse con session-id)
  const sessionHeader = req.headers["mcp-session-id"];
  const streamableSessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  if (streamableSessionId && streamableSessions.has(streamableSessionId)) {
    const session = streamableSessions.get(streamableSessionId)!;
    session.lastActive = Date.now();
    await session.transport.handleRequest(req, res);
    return;
  }

  console.error("[SENTINEL-MCP] Nueva conexión SSE recibida.");
  
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
    activeTransports.set(sessionId, sessionObj);

    req.on("close", async () => {
      console.error(`[SENTINEL-MCP] Conexión SSE cerrada para sesión: ${sessionId}`);
      if (sessionId) activeTransports.delete(sessionId);
      try {
        if (activeTransport) await activeTransport.close();
      } catch (e) {}
      try {
        if (sessionServer) await sessionServer.close();
      } catch (e) {}
    });

    await sessionServer.connect(activeTransport);
  } catch (error: any) {
    console.error("[SENTINEL-MCP] Error al establecer conexión SSE:", error);
    if (!res.headersSent) {
      res.status(500).send("Failed to establish SSE connection");
    }
  }
});

// Configuración de puertos y host
const appPort = Number(process.env.SOGNA_MCP_SENTINEL_PORT) || 8002;
const appHost = "127.0.0.1";

const httpServer = app.listen(appPort, appHost, () => {
  console.error(`[SENTINEL-MCP] Servidor corriendo en http://${appHost}:${appPort}`);
  console.error(`[SENTINEL-MCP] Endpoint SSE disponible en http://${appHost}:${appPort}/sse`);
});

// Garbage collector para sesiones inactivas
const IDLE_SESSION_TIMEOUT_MS = 120000; // 2 minutos sin actividad
const CHECK_INTERVAL_MS = 30000; // Cada 30 segundos

setInterval(async () => {
  const now = Date.now();
  
  // Limpiar transporte SSE legacy
  for (const [sessionId, session] of activeTransports.entries()) {
    const isSocketDestroyed = session.req.socket?.destroyed || session.req.destroyed;
    const isIdle = now - session.lastActive > IDLE_SESSION_TIMEOUT_MS;
    
    if (isSocketDestroyed || isIdle) {
      const reason = isSocketDestroyed ? "Socket destroyed" : "Session idle timeout";
      console.warn(`[SENTINEL-MCP] Cleaning up zombie SSE session ${sessionId}. Reason: ${reason}`);
      activeTransports.delete(sessionId);
      try {
        await session.transport.close();
      } catch (e) {}
      try {
        await session.server.close();
      } catch (e) {}
    }
  }

  // Limpiar sesiones Streamable HTTP
  for (const [sessionId, session] of streamableSessions.entries()) {
    if (now - session.lastActive > IDLE_SESSION_TIMEOUT_MS) {
      console.warn(`[SENTINEL-MCP] Cleaning up idle streamable session ${sessionId}.`);
      streamableSessions.delete(sessionId);
      try {
        await session.transport.close();
      } catch (e) {}
      try {
        await session.server.close();
      } catch (e) {}
    }
  }
}, CHECK_INTERVAL_MS);

process.on("SIGTERM", () => {
  console.error("[SENTINEL-MCP] Deteniendo servidor de forma ordenada...");
  httpServer.close(() => {
    process.exit(0);
  });
});
