import path from "node:path";
import { pathToFileURL } from "node:url";

type SognatoreMcpLibs = {
  listAgents: (root: string) => unknown[];
  getAgentPlaybook: (root: string, id: string) => unknown;
  routeTask: (root: string, task: string) => unknown;
  getProjectContext: (root: string) => unknown;
  enqueueWorkerJob: (root: string, opts: Record<string, unknown>) => unknown;
  getWorkerJobStatus: (root: string, id: string) => unknown;
  listWorkerJobs: (root: string) => unknown[];
  SCRIPT_REGISTRY: Record<string, unknown>;
};

let cached: SognatoreMcpLibs | null = null;

export async function loadSognatoreMcpLibs(sognaRoot: string): Promise<SognatoreMcpLibs> {
  if (cached) return cached;

  const libDir = path.join(sognaRoot, "scripts", "lib");
  const [agent, router, context, worker] = await Promise.all([
    import(pathToFileURL(path.join(libDir, "agent-catalog.mjs")).href),
    import(pathToFileURL(path.join(libDir, "task-router.mjs")).href),
    import(pathToFileURL(path.join(libDir, "project-context.mjs")).href),
    import(pathToFileURL(path.join(libDir, "worker-queue.mjs")).href),
  ]);

  cached = {
    listAgents: agent.listAgents,
    getAgentPlaybook: agent.getAgentPlaybook,
    routeTask: router.routeTask,
    getProjectContext: context.getProjectContext,
    enqueueWorkerJob: worker.enqueueWorkerJob,
    getWorkerJobStatus: worker.getWorkerJobStatus,
    listWorkerJobs: worker.listWorkerJobs,
    SCRIPT_REGISTRY: worker.SCRIPT_REGISTRY,
  };

  return cached;
}

export const MCP_AMPLIFIER_TOOLS = [
  {
    name: "list_agents",
    description:
      "Lista agentes institucionales de Curator/agents (id, grupo, task_types). Sin API key.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_agent_playbook",
    description: "Devuelve el playbook markdown completo de un agente por id.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Id del agente, ej. review-security" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "route_task",
    description:
      "Enruta una tarea a departamentos y agentes recomendados sin llamar LLM cloud.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Descripción de la tarea" },
      },
      required: ["task"],
    },
  },
  {
    name: "get_project_context",
    description:
      "Paquete de contexto: identidad, misión swarm, grafo resumido, episodio reciente.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "enqueue_worker_job",
    description:
      "Encola trabajo local (script determinista u Ollama). Devuelve job_id para consultar estado.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["script", "ollama"] },
        action: {
          type: "string",
          description:
            "Para kind=script: sentinel-audit, corners-verify, mcp-clients, mcp-health, uma-doctor, sognatore-doctor",
        },
        task: { type: "string", description: "Para kind=ollama: prompt/tarea larga" },
        tier: { type: "string", description: "T3|T4|T5 — informativo" },
      },
      required: ["kind"],
    },
  },
  {
    name: "get_worker_job_status",
    description: "Estado y salida parcial de un job encolado con enqueue_worker_job.",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string" },
      },
      required: ["job_id"],
    },
  },
  {
    name: "list_worker_jobs",
    description: "Lista los últimos trabajos del worker local.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

export const MCP_AMPLIFIER_READ_TOOLS = new Set([
  "list_agents",
  "get_agent_playbook",
  "route_task",
  "get_project_context",
  "get_worker_job_status",
  "list_worker_jobs",
]);

export async function handleAmplifierTool(
  sognaRoot: string,
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<{ text: string; isError?: boolean }> {
  const libs = await loadSognatoreMcpLibs(sognaRoot);

  switch (name) {
    case "list_agents": {
      const agents = libs.listAgents(sognaRoot);
      return { text: JSON.stringify({ count: agents.length, agents }, null, 2) };
    }
    case "get_agent_playbook": {
      const agentId = String(args?.agent_id || "");
      if (!agentId) return { text: "agent_id requerido", isError: true };
      const result = libs.getAgentPlaybook(sognaRoot, agentId);
      return { text: JSON.stringify(result, null, 2) };
    }
    case "route_task": {
      const task = String(args?.task || "");
      if (!task) return { text: "task requerido", isError: true };
      return { text: JSON.stringify(libs.routeTask(sognaRoot, task), null, 2) };
    }
    case "get_project_context":
      return { text: JSON.stringify(libs.getProjectContext(sognaRoot), null, 2) };
    case "enqueue_worker_job": {
      const kind = args?.kind as string;
      if (kind !== "script" && kind !== "ollama") {
        return { text: "kind debe ser script u ollama", isError: true };
      }
      if (kind === "script" && !args?.action) {
        return { text: "action requerido para kind=script", isError: true };
      }
      if (kind === "ollama" && !args?.task) {
        return { text: "task requerido para kind=ollama", isError: true };
      }
      const result = libs.enqueueWorkerJob(sognaRoot, {
        kind,
        action: args?.action,
        task: args?.task,
        tier: args?.tier,
      });
      return { text: JSON.stringify(result, null, 2) };
    }
    case "get_worker_job_status": {
      const jobId = String(args?.job_id || "");
      if (!jobId) return { text: "job_id requerido", isError: true };
      const job = libs.getWorkerJobStatus(sognaRoot, jobId);
      if (!job) return { text: `Job no encontrado: ${jobId}`, isError: true };
      return { text: JSON.stringify(job, null, 2) };
    }
    case "list_worker_jobs":
      return { text: JSON.stringify(libs.listWorkerJobs(sognaRoot), null, 2) };
    default:
      return { text: `Herramienta desconocida: ${name}`, isError: true };
  }
}
