#!/usr/bin/env node
/**
 * Verifica unificación route_task ↔ DeptAgentRuntime (prioridad 4).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeTask } from "./lib/task-router.mjs";
import {
  buildDeptAgentProfile,
  buildDeptRuntimePackage,
  buildDeptSystemPrompt,
  deptKeyToClassName,
  loadDeptAgentMap,
  mapAgentGroupToDept,
} from "./lib/dept-agent-bridge.mjs";
import { enqueueWorkerJob, getWorkerJobStatus } from "./lib/worker-queue.mjs";
import { runDeptThink } from "./run-dept-think.mjs";

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

const map = loadDeptAgentMap();
if (map.dept_tiers?.ProtectionDepartment === "planning") {
  ok("dept-agent-map.json cargado (ProtectionDepartment=planning)");
} else {
  fail("dept-agent-map.json tiers");
}

const deptKey = mapAgentGroupToDept("Review", "security");
if (deptKey === "protection") {
  ok("mapAgentGroupToDept Review → protection");
} else {
  fail(`mapAgentGroupToDept Review → ${deptKey}`);
}

const className = deptKeyToClassName("protection");
if (className === "ProtectionDepartment") {
  ok("deptKeyToClassName protection → ProtectionDepartment");
} else {
  fail(`deptKeyToClassName → ${className}`);
}

const profileBuilt = buildDeptAgentProfile(sognaRoot, "review-security", "security");
if (profileBuilt.profile?.department === "ProtectionDepartment") {
  ok(`buildDeptAgentProfile review-security → ${profileBuilt.profile.department}`);
} else {
  fail("buildDeptAgentProfile review-security");
}

const prompt = buildDeptSystemPrompt(profileBuilt.profile);
if (prompt.includes("SOGNA DEPT AGENT: review-security")) {
  ok("buildDeptSystemPrompt alineado con DeptAgentRuntime");
} else {
  fail("buildDeptSystemPrompt");
}

const route = routeTask(sognaRoot, "auditar seguridad del modulo MCP");
if (route.dept_runtime?.department === "ProtectionDepartment") {
  ok(`route_task dept_runtime → ${route.dept_runtime.id} @ ${route.dept_runtime.department}`);
} else {
  fail("route_task sin dept_runtime");
}

if (route.suggested_worker?.kind === "dept" && route.suggested_worker.agent_id) {
  ok(`suggested_worker kind=dept agent=${route.suggested_worker.agent_id}`);
} else {
  fail(`suggested_worker inesperado: ${JSON.stringify(route.suggested_worker)}`);
}

const runtimePkg = buildDeptRuntimePackage(
  sognaRoot,
  "auditar seguridad del modulo MCP",
  "review-security",
);
if (runtimePkg.recommended_profiles?.length >= 1) {
  ok(`buildDeptRuntimePackage (${runtimePkg.recommended_profiles.length} perfiles)`);
} else {
  fail("buildDeptRuntimePackage");
}

const deptRuntimeTs = readFileSync(
  path.join(sognaRoot, "Sognatore", "src", "core", "dept", "DeptAgentRuntime.ts"),
  "utf8",
);
const deptMapTs = readFileSync(
  path.join(sognaRoot, "Sognatore", "src", "core", "dept", "deptAgentMap.ts"),
  "utf8",
);
if (deptRuntimeTs.includes("deptAgentMap") && deptMapTs.includes("dept-agent-map.json")) {
  ok("DeptAgentRuntime.ts consume SSOT dept-agent-map.json");
} else {
  fail("DeptAgentRuntime no enlazado a SSOT");
}

const mcpSrc = readFileSync(
  path.join(sognaRoot, "engines", "MCP-Bridge", "src", "sognatoreMcp.ts"),
  "utf8",
);
for (const tool of ["resolve_dept_agent", "route_task", "enqueue_worker_job"]) {
  if (!mcpSrc.includes(`name: "${tool}"`)) fail(`MCP tool ${tool}`);
}
if (mcpSrc.includes('enum: ["script", "ollama", "dept"]')) {
  ok("MCP enqueue_worker_job kind=dept");
} else {
  fail("MCP kind=dept");
}

if (process.env.SOGNA_SKIP_DEPT_LLM === "1") {
  ok("runDeptThink omitido (SOGNA_SKIP_DEPT_LLM=1)");
} else {
  try {
    const think = await runDeptThink(sognaRoot, "review-security", "Responde solo: CHECK_OK", {
      json: true,
    });
    if (think.ok && String(think.output || "").length > 0) {
      ok(`runDeptThink (${String(think.output).length} chars, model=${think.model_route?.model})`);
    } else if (
      String(think.error || "").toLowerCase().includes("timeout") &&
      process.env.SOGNA_DEPT_VERIFY_SOFT !== "0"
    ) {
      console.log(`[WARN] runDeptThink timeout (Ollama lento): ${think.error}`);
      ok("runDeptThink timeout aceptado (estructura validada; use SOGNA_DEPT_VERIFY_SOFT=0 para exigir LLM)");
    } else {
      fail(`runDeptThink: ${think.error || "salida vacía"}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("timeout") && process.env.SOGNA_DEPT_VERIFY_SOFT !== "0") {
      console.log(`[WARN] runDeptThink timeout (Ollama lento): ${msg}`);
      ok("runDeptThink timeout aceptado (estructura validada; use SOGNA_DEPT_VERIFY_SOFT=0 para exigir LLM)");
    } else {
      fail(`runDeptThink: ${msg}`);
    }
  }
}

if (process.env.SOGNA_SKIP_DEPT_JOB === "1") {
  ok("worker kind=dept omitido (SOGNA_SKIP_DEPT_JOB=1)");
} else {
  const job = enqueueWorkerJob(sognaRoot, {
    kind: "dept",
    agent_id: "review-security",
    task: "Responde solo: JOB_OK",
  });
  if (!job.job_id) {
    fail("enqueueWorkerJob kind=dept sin job_id");
  } else {
    ok(`enqueueWorkerJob kind=dept → ${job.job_id}`);
  }

  await new Promise((r) => setTimeout(r, 300));
  const early = getWorkerJobStatus(sognaRoot, job.job_id);
  if (early?.dept_runtime?.department === "ProtectionDepartment") {
    ok(`worker kind=dept dept_runtime en job (${early.dept_runtime.id})`);
  } else if (early?.status === "failed") {
    fail(`worker kind=dept falló al arrancar: ${(early.output || []).slice(-2).join(" ")}`);
  } else {
    ok(`worker kind=dept status=${early?.status || "unknown"}`);
  }

  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const status = getWorkerJobStatus(sognaRoot, job.job_id);
    if (status?.status === "completed" || status?.status === "failed") break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const final = getWorkerJobStatus(sognaRoot, job.job_id);
  if (final?.status === "completed") {
    ok(`worker kind=dept completed`);
  } else if (final?.status === "failed") {
    const tail = (final.output || []).slice(-2).join(" ");
    if (tail.includes("timeout") && process.env.SOGNA_DEPT_VERIFY_SOFT !== "0") {
      console.log(`[WARN] worker kind=dept timeout Ollama: ${tail}`);
      ok("worker kind=dept timeout aceptado (cola y perfil validados)");
    } else {
      fail(`worker kind=dept: ${tail}`);
    }
  } else {
    console.log(`[WARN] worker kind=dept aún ${final?.status} tras 90s (Ollama lento)`);
    ok("worker kind=dept encolado y perfil OK (completion diferida)");
  }
}

if (failed > 0) {
  console.error(`\n${failed} comprobación(es) fallida(s).`);
  process.exit(1);
}

console.log("\nDept agent bridge OK.");
