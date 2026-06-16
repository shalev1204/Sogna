#!/usr/bin/env node
/**
 * Verifica herramientas MCP Amplifier (Fase 1) vía lib SSOT.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, getAgentPlaybook } from "./lib/agent-catalog.mjs";
import { routeTask } from "./lib/task-router.mjs";
import { getProjectContext } from "./lib/project-context.mjs";
import { loadIntelligenceConfig } from "./lib/intelligence-config.mjs";
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
} else {
  ok(`route_task: ${route.task_type} → ${route.recommended_agents.map((a) => a.id).join(", ")}`);
}

const ctx = getProjectContext(sognaRoot);
if (!ctx.intelligence_mode) {
  fail("get_project_context");
} else {
  ok("get_project_context");
}

if (!SCRIPT_REGISTRY["mcp-clients"]) {
  fail("SCRIPT_REGISTRY missing mcp-clients");
} else {
  ok("SCRIPT_REGISTRY");
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
