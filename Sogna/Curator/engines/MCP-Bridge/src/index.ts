import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// --- Configuración de Rutas ---
const ROOT_PATH = "c:\\Users\\carle\\Desktop\\Sogna\\Sogna";
const GRAPH_PATH = path.join(ROOT_PATH, "memory", "intelligence", "semantic", "graph.json");
const IDENTITY_PATH = path.join(ROOT_PATH, "memory", "identity", "sogna.md");
const SWARM_STATE_PATH = path.join(ROOT_PATH, "memory", "operational", "agent", "active_state.json");
const SENTINEL_VETO_PATH = path.join(ROOT_PATH, "Curator", "engines", "Sentinel", "bin", "sentinel-veto.js");
const AUDIT_LOG_PATH = path.join(ROOT_PATH, "memory", "operational", "logs", "mcp_audit.json");

// --- Esquemas de Validación (SSOT) ---
const SwarmStateSchema = z.object({
  mission: z.string(),
  hardening_status: z.string(),
  synapse_state: z.string(),
  pending_tasks: z.array(z.string()),
  last_milestone: z.string(),
});

// --- Inicialización del Servidor ---
const server = new Server(
  {
    name: "Sogna",
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  await auditLog("CALL_TOOL", { name, args });

  try {
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

    if (name === "verify_sentinel_integrity") {
      const { stdout, stderr } = await execAsync(`node "${SENTINEL_VETO_PATH}"`);
      return { content: [{ type: "text", text: stdout || stderr }] };
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
      const validated = SwarmStateSchema.parse(updatedData);
      
      await fs.writeFile(SWARM_STATE_PATH, JSON.stringify(validated, null, 2));
      return {
        content: [{ type: "text", text: "Mission updated and validated successfully." }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en herramienta institucional: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sogna connected via stdio");
}

main().catch((error) => {
  console.error("Fatal error in Sogna:", error);
  process.exit(1);
});
