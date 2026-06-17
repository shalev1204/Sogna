#!/usr/bin/env node
/**
 * Verifica herramientas MCP Amplifier (Fase 1) vía lib SSOT.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, getAgentPlaybook } from "./lib/agent-catalog.mjs";
import { routeTask } from "./lib/task-router.mjs";
import { getProjectContext } from "./lib/project-context.mjs";
import { loadIntelligenceConfig } from "./lib/intelligence-config.mjs";
import { buildDispatchBrief } from "./lib/dispatch-brief.mjs";
import {
  enqueueWorkerJob,
  getWorkerJobStatus,
  SCRIPT_REGISTRY,
} from "./lib/worker-queue.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

const cfg = loadIntelligenceConfig(sognaRoot);
if (cfg.intelligence.mode !== "local") {
  fail(`intelligence.mode expected local, got ${cfg.intelligence.mode}`);
} else {
  ok(`intelligence.mode=local (keyless=${cfg.keyless})`);
}

const agents = listAgents(sognaRoot);
if (agents.length < 10) {
  fail(`list_agents: expected >=10 agents, got ${agents.length}`);
} else {
  ok(`list_agents: ${agents.length} agentes`);
}

const playbook = getAgentPlaybook(sognaRoot, "orchestrator");
if (playbook.error || !playbook.playbook) {
  fail("get_agent_playbook orchestrator");
} else {
  ok("get_agent_playbook orchestrator");
}

const route = routeTask(sognaRoot, "auditar seguridad del modulo MCP");
if (!route.recommended_agents?.length) {
  fail("route_task security");
} else if (!route.dept_runtime?.department) {
  fail("route_task sin dept_runtime");
} else {
  ok(
    `route_task: ${route.task_type} → ${route.recommended_agents.map((a) => a.id).join(", ")} | dept=${route.dept_runtime.department}`,
  );
}

const ctx = getProjectContext(sognaRoot);
if (!ctx.intelligence_mode) {
  fail("get_project_context");
} else {
  ok("get_project_context");
}

const brief = buildDispatchBrief(sognaRoot, {
  task: "auditar seguridad del modulo MCP",
  agentId: "orchestrator",
});
if (!brief.brief || brief.brief.length < 80 || !brief.brief.includes("orchestrator")) {
  fail("build_dispatch_brief");
} else {
  ok(`build_dispatch_brief (${brief.brief.length} chars)`);
}

const toolNames = [
  "list_agents",
  "get_agent_playbook",
  "route_task",
  "resolve_dept_agent",
  "get_project_context",
  "build_dispatch_brief",
  "enqueue_worker_job",
  "get_worker_job_status",
  "list_worker_jobs",
  "ollama_doctor",
  "get_ollama_routing",
  "resolve_ollama_model",
  "uma_semantic_recall",
];
const mcpSrc = readFileSync(
  path.join(sognaRoot, "engines", "MCP-Bridge", "src", "sognatoreMcp.ts"),
  "utf8",
);
for (const name of toolNames) {
  if (!mcpSrc.includes(`name: "${name}"`)) {
    fail(`MCP tool ${name} no registrada en sognatoreMcp.ts`);
  }
}
if (toolNames.every((n) => mcpSrc.includes(`name: "${n}"`))) {
  ok(`MCP Amplifier tools (${toolNames.length}) registradas en Bridge`);
}

if (!SCRIPT_REGISTRY["mcp-clients"] || !SCRIPT_REGISTRY["mcp-amplifier"] || !SCRIPT_REGISTRY["ollama-doctor"]) {
  fail("SCRIPT_REGISTRY missing expected worker scripts");
} else {
  ok(`SCRIPT_REGISTRY (${Object.keys(SCRIPT_REGISTRY).length} acciones)`);
}

const job = enqueueWorkerJob(sognaRoot, { kind: "script", action: "mcp-clients" });
if (!job.job_id) {
  fail("enqueue_worker_job");
} else {
  ok(`enqueue_worker_job: ${job.job_id}`);
  await new Promise((r) => setTimeout(r, 8000));
  const status = getWorkerJobStatus(sognaRoot, job.job_id);
  if (!status) {
    fail("get_worker_job_status");
  } else if (status.status === "failed") {
    fail(`worker job failed: ${(status.output || []).slice(-3).join(" ")}`);
  } else {
    ok(`worker job status=${status.status}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} comprobación(es) fallida(s).`);
  process.exit(1);
}

console.log("\nMCP Amplifier libs OK.");
