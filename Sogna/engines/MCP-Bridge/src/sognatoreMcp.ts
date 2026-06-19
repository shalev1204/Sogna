import path from "node:path";
import { pathToFileURL } from "node:url";

type BriefModule = {
  buildDispatchBrief: (
    root: string,
    opts: { task?: string; agentId?: string; query?: string; umaRecall?: string },
  ) => { brief: string; agent_id?: string; context: unknown; agents_available: number };
};

type SognatoreMcpLibs = {
  listAgents: (root: string) => unknown[];
  getAgentPlaybook: (root: string, id: string) => unknown;
  routeTask: (root: string, task: string, opts?: { agent_id?: string }) => unknown;
  getProjectContext: (root: string) => unknown;
  buildDispatchBrief: BriefModule["buildDispatchBrief"];
  enqueueWorkerJob: (root: string, opts: Record<string, unknown>) => unknown;
  getWorkerJobStatus: (root: string, id: string) => Promise<unknown>;
  listWorkerJobs: (root: string) => unknown[];
  SCRIPT_REGISTRY: Record<string, unknown>;
  buildDeptAgentProfile: (root: string, agentId: string, taskType?: string) => unknown;
  buildDeptRuntimePackage: (
    root: string,
    task: string,
    preferredAgentId?: string,
  ) => unknown;
  runOllamaDoctor: (root: string) => Promise<unknown>;
  resolveOllamaModel: (
    root: string,
    task: string,
    modelOverride?: string,
  ) => { model: string; task_type: string; source: string };
  getOllamaRoutingSnapshot: (root: string) => unknown;
};

let cached: SognatoreMcpLibs | null = null;

export async function fetchUmaRecall(query: string): Promise<string | undefined> {
  const host = process.env.SOGNA_MCP_HOST || "127.0.0.1";
  const port = process.env.SOGNA_UMA_API_PORT || "8080";
  try {
    const res = await fetch(`http://${host}:${port}/memory/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, n_results: 3 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { raw_output?: string };
    return data.raw_output;
  } catch {
    return undefined;
  }
}

export async function loadSognatoreMcpLibs(sognaRoot: string): Promise<SognatoreMcpLibs> {
  if (cached) return cached;

  const libDir = path.join(sognaRoot, "scripts", "lib");
  const [agent, router, context, worker, brief, deptBridge, ollamaDoctor, ollamaRouting] =
    await Promise.all([
    import(pathToFileURL(path.join(libDir, "agent-catalog.mjs")).href),
    import(pathToFileURL(path.join(libDir, "task-router.mjs")).href),
    import(pathToFileURL(path.join(libDir, "project-context.mjs")).href),
    import(pathToFileURL(path.join(libDir, "worker-queue.mjs")).href),
    import(pathToFileURL(path.join(libDir, "dispatch-brief.mjs")).href),
    import(pathToFileURL(path.join(libDir, "dept-agent-bridge.mjs")).href),
    import(pathToFileURL(path.join(libDir, "ollama-doctor.mjs")).href),
    import(pathToFileURL(path.join(libDir, "ollama-routing.mjs")).href),
  ]);

  cached = {
    listAgents: agent.listAgents,
    getAgentPlaybook: agent.getAgentPlaybook,
    routeTask: router.routeTask,
    getProjectContext: context.getProjectContext,
    buildDispatchBrief: (brief as BriefModule).buildDispatchBrief,
    enqueueWorkerJob: worker.enqueueWorkerJob,
    getWorkerJobStatus: worker.getWorkerJobStatus,
    listWorkerJobs: worker.listWorkerJobs,
    SCRIPT_REGISTRY: worker.SCRIPT_REGISTRY,
    buildDeptAgentProfile: deptBridge.buildDeptAgentProfile,
    buildDeptRuntimePackage: deptBridge.buildDeptRuntimePackage,
    runOllamaDoctor: ollamaDoctor.runOllamaDoctor,
    resolveOllamaModel: ollamaRouting.resolveOllamaModel,
    getOllamaRoutingSnapshot: ollamaRouting.getOllamaRoutingSnapshot,
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
      "Enruta una tarea a departamentos y agentes recomendados sin LLM cloud. Incluye dept_runtime (perfil DeptAgentRuntime).",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Descripción de la tarea" },
        agent_id: { type: "string", description: "Agente preferido (opcional)" },
      },
      required: ["task"],
    },
  },
  {
    name: "resolve_dept_agent",
    description:
      "Resuelve perfil DeptAgentRuntime para un agente Curator y tarea (departamento, tier, modelo Ollama).",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Id agente Curator" },
        task: { type: "string", description: "Tarea para inferir task_type" },
      },
      required: ["agent_id", "task"],
    },
  },
  {
    name: "get_project_context",
    description:
      "Paquete de contexto: identidad, misión swarm, grafo resumido, episodio reciente.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "build_dispatch_brief",
    description:
      "Genera brief de delegación (routing, playbook, contexto UMA opcional) para el IDE. Sin API key.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Descripción de tarea para enrutamiento" },
        agent_id: { type: "string", description: "Id agente Curator (ej. review-security)" },
        query: {
          type: "string",
          description: "Consulta UMA; si :8080 responde, se incluye recall en el brief",
        },
      },
    },
  },
  {
    name: "enqueue_worker_job",
    description:
      "Encola trabajo local. kind=celery delega al worker Celery/Redis para tareas pesadas (batch, reindex, Ollama masivo). kind=script|ollama|dept usa la cola JSON local para scripts ligeros.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["script", "ollama", "dept", "celery"] },
        action: {
          type: "string",
          description:
            "Para kind=script: sentinel-audit, corners-verify, mcp-clients, mcp-health, mcp-amplifier, mcp-delegate, dispatch-verify, worker-verify, ollama-doctor, uma-doctor, sognatore-doctor",
        },
        agent_id: { type: "string", description: "Para kind=dept: id agente Curator" },
        task: { type: "string", description: "Para kind=ollama o dept: prompt/tarea" },
        model: {
          type: "string",
          description: "Para kind=ollama: modelo Ollama opcional (override del routing)",
        },
        tier: { type: "string", description: "T3|T4|T5 — informativo" },
        celery_task: {
          type: "string",
          description: "Para kind=celery: nombre de tarea registrada. Opciones: memory.reindex, memory.doctor, ollama.generate, script.run, batch.process",
        },
        celery_kwargs: {
          type: "object",
          description: "Para kind=celery: kwargs de la tarea. Ejemplo memory.reindex: {layers: ['identity','operational']}. Ejemplo ollama.generate: {prompt: '...', model: 'llama3.2'}",
        },
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
  {
    name: "ollama_doctor",
    description:
      "Diagnóstico Ollama local: versión, modelos instalados vs routing_rules en .sognarc.json.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_ollama_routing",
    description:
      "Tabla task_type → modelo Ollama resuelto (routing_rules + defaults). Sin inferencia.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "resolve_ollama_model",
    description:
      "Resuelve modelo Ollama para una tarea (detecta task_type). Opcional override de modelo.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "Texto de la tarea" },
        model: { type: "string", description: "Modelo Ollama opcional (override)" },
      },
      required: ["task"],
    },
  },
  {
    name: "uma_semantic_recall",
    description:
      "Proxy a UMA API :8080 — búsqueda semántica GraphRAG (paridad tool UMA).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Consulta semántica" },
      },
      required: ["query"],
    },
  },
] as const;

export const MCP_AMPLIFIER_READ_TOOLS = new Set([
  "list_agents",
  "get_agent_playbook",
  "route_task",
  "resolve_dept_agent",
  "get_project_context",
  "build_dispatch_brief",
  "get_worker_job_status",
  "list_worker_jobs",
  "ollama_doctor",
  "get_ollama_routing",
  "uma_semantic_recall",
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
      const agentId = args?.agent_id ? String(args.agent_id) : undefined;
      return {
        text: JSON.stringify(libs.routeTask(sognaRoot, task, { agent_id: agentId }), null, 2),
      };
    }
    case "resolve_dept_agent": {
      const agentId = String(args?.agent_id || "");
      const task = String(args?.task || "");
      if (!agentId || !task) {
        return { text: "agent_id y task requeridos", isError: true };
      }
      const pkg = libs.buildDeptRuntimePackage(sognaRoot, task, agentId);
      const profile = libs.buildDeptAgentProfile(sognaRoot, agentId);
      return {
        text: JSON.stringify({ runtime_package: pkg, agent_profile: profile }, null, 2),
      };
    }
    case "get_project_context":
      return { text: JSON.stringify(libs.getProjectContext(sognaRoot), null, 2) };
    case "build_dispatch_brief": {
      const task = args?.task ? String(args.task) : undefined;
      const agentId = args?.agent_id ? String(args.agent_id) : undefined;
      const query = args?.query ? String(args.query) : undefined;

      if (!task && !agentId && !query) {
        return {
          text: "Indique al menos uno: task, agent_id o query",
          isError: true,
        };
      }

      const umaRecall = query ? await fetchUmaRecall(query) : undefined;
      const brief = libs.buildDispatchBrief(sognaRoot, {
        task: task || query,
        agentId,
        query,
        umaRecall,
      });
      return { text: JSON.stringify(brief, null, 2) };
    }
    case "enqueue_worker_job": {
      const kind = args?.kind as string;
      if (kind !== "script" && kind !== "ollama" && kind !== "dept" && kind !== "celery") {
        return { text: "kind debe ser script, ollama, dept o celery", isError: true };
      }
      if (kind === "script" && !args?.action) {
        return { text: "action requerido para kind=script", isError: true };
      }
      if (kind === "ollama" && !args?.task) {
        return { text: "task requerido para kind=ollama", isError: true };
      }
      if (kind === "dept" && (!args?.agent_id || !args?.task)) {
        return { text: "agent_id y task requeridos para kind=dept", isError: true };
      }
      if (kind === "celery" && !args?.celery_task) {
        return { text: "celery_task requerido para kind=celery (memory.reindex|memory.doctor|ollama.generate|script.run|batch.process)", isError: true };
      }
      const result = libs.enqueueWorkerJob(sognaRoot, {
        kind,
        action: args?.action,
        task: args?.task,
        agent_id: args?.agent_id,
        model: args?.model,
        tier: args?.tier,
        celery_task: args?.celery_task,
        celery_kwargs: args?.celery_kwargs,
      });
      return { text: JSON.stringify(result, null, 2) };
    }
    case "get_worker_job_status": {
      const jobId = String(args?.job_id || "");
      if (!jobId) return { text: "job_id requerido", isError: true };
      const job = await libs.getWorkerJobStatus(sognaRoot, jobId);
      if (!job) return { text: `Job no encontrado: ${jobId}`, isError: true };
      return { text: JSON.stringify(job, null, 2) };
    }
    case "list_worker_jobs":
      return { text: JSON.stringify(libs.listWorkerJobs(sognaRoot), null, 2) };
    case "ollama_doctor": {
      const doctor = await libs.runOllamaDoctor(sognaRoot);
      return { text: JSON.stringify(doctor, null, 2) };
    }
    case "get_ollama_routing":
      return { text: JSON.stringify(libs.getOllamaRoutingSnapshot(sognaRoot), null, 2) };
    case "resolve_ollama_model": {
      const task = String(args?.task || "");
      if (!task) return { text: "task requerido", isError: true };
      const modelOverride = args?.model ? String(args.model) : undefined;
      return {
        text: JSON.stringify(libs.resolveOllamaModel(sognaRoot, task, modelOverride), null, 2),
      };
    }
    case "uma_semantic_recall": {
      const query = String(args?.query || "");
      if (!query) return { text: "query requerido", isError: true };
      const recall = await fetchUmaRecall(query);
      if (!recall) {
        return {
          text: "UMA API :8080 no disponible o sin respuesta. Ejecute pnpm sogna:on.",
          isError: true,
        };
      }
      return { text: recall };
    }
    default:
      return { text: `Herramienta desconocida: ${name}`, isError: true };
  }
}
