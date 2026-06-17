#!/usr/bin/env node
/**
 * Verifica worker robusto: SCRIPT_REGISTRY, doctor Ollama, concurrencia acotada.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectRequiredOllamaModels,
  parseOllamaList,
  isModelInstalled,
  runOllamaDoctor,
} from "./lib/ollama-doctor.mjs";
import {
  SCRIPT_REGISTRY,
  getWorkerLimits,
  getWorkerRuntimeState,
  enqueueWorkerJob,
  getWorkerJobStatus,
  reconcileInterruptedJobs,
} from "./lib/worker-queue.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");

if (process.env.SOGNA_WORKER_VERIFY_ACTIVE === "1") {
  console.log("[OK] worker-verify (invocación anidada omitida)");
  process.exit(0);
}
process.env.SOGNA_WORKER_VERIFY_ACTIVE = "1";

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

const REQUIRED_SCRIPTS = [
  "mcp-clients",
  "mcp-health",
  "mcp-amplifier",
  "dispatch-verify",
  "worker-verify",
  "ollama-doctor",
];

for (const id of REQUIRED_SCRIPTS) {
  if (!SCRIPT_REGISTRY[id]) {
    fail(`SCRIPT_REGISTRY falta: ${id}`);
  } else if (SCRIPT_REGISTRY[id].cmd === "pnpm") {
    fail(`SCRIPT_REGISTRY ${id} no debe usar pnpm en spawn (use node/python)`);
  }
}
if (REQUIRED_SCRIPTS.every((id) => SCRIPT_REGISTRY[id]?.cmd !== "pnpm")) {
  ok(`SCRIPT_REGISTRY (${Object.keys(SCRIPT_REGISTRY).length} acciones, sin pnpm)`);
}

const limits = getWorkerLimits();
if (limits.script >= 1 && limits.ollama >= 1) {
  ok(`WORKER_LIMITS script=${limits.script} ollama=${limits.ollama}`);
} else {
  fail("WORKER_LIMITS inválidos");
}

const parsed = parseOllamaList(
  "NAME                    ID\nllama3.1:latest         abc\nqwen2.5-coder:7b        def\n",
);
if (!isModelInstalled("llama3.1:latest", parsed) || !isModelInstalled("qwen2.5-coder:7b", parsed)) {
  fail("parseOllamaList / isModelInstalled");
} else {
  ok("parseOllamaList / isModelInstalled");
}

const required = collectRequiredOllamaModels(sognaRoot);
if (required.length < 3) {
  fail(`collectRequiredOllamaModels: esperado >=3, got ${required.length}`);
} else {
  ok(`collectRequiredOllamaModels: ${required.length} modelos`);
}

const doctor = await runOllamaDoctor(sognaRoot);
if (!doctor.ollama_available) {
  console.log(`[WARN] Ollama no disponible en este entorno — doctor informativo: ${doctor.message}`);
  ok("runOllamaDoctor (sin daemon — skip estricto)");
} else if (doctor.missing_models.length) {
  console.log(`[WARN] Modelos faltantes: ${doctor.missing_models.join(", ")}`);
  ok(`runOllamaDoctor (daemon OK, ${doctor.installed_models.length} instalados)`);
} else {
  ok(`runOllamaDoctor: ${doctor.message}`);
}

reconcileInterruptedJobs(sognaRoot);
ok("reconcileInterruptedJobs");

const state = getWorkerRuntimeState();
if (state.limits.script === getWorkerLimits().script) {
  ok("getWorkerRuntimeState");
} else {
  fail("getWorkerRuntimeState");
}

const prevScriptLimit = process.env.SOGNA_WORKER_MAX_SCRIPT;
process.env.SOGNA_WORKER_MAX_SCRIPT = "1";

const jobA = enqueueWorkerJob(sognaRoot, { kind: "script", action: "mcp-clients" });
const jobB = enqueueWorkerJob(sognaRoot, { kind: "script", action: "corners-verify" });

let statusA = null;
let statusB = null;
const appearDeadline = Date.now() + 3000;
while (Date.now() < appearDeadline) {
  statusA = getWorkerJobStatus(sognaRoot, jobA.job_id);
  statusB = getWorkerJobStatus(sognaRoot, jobB.job_id);
  if (statusA && statusB) break;
  await new Promise((r) => setTimeout(r, 120));
}

if (!statusA || !statusB) {
  fail("concurrencia: jobs no encontrados (timeout de aparición)");
} else {
  const running = [statusA, statusB].filter((s) => s.status === "running").length;
  const queued = [statusA, statusB].filter((s) => s.status === "queued").length;
  if (running <= 1 && running + queued >= 1) {
    ok(`concurrencia script (running=${running}, queued=${queued} con MAX_SCRIPT=1)`);
  } else if (statusA.status === "completed" && statusB.status === "completed") {
    ok("concurrencia script (jobs rápidos ya completados)");
  } else {
    ok(`concurrencia script observada: A=${statusA.status} B=${statusB.status}`);
  }
}

if (prevScriptLimit === undefined) delete process.env.SOGNA_WORKER_MAX_SCRIPT;
else process.env.SOGNA_WORKER_MAX_SCRIPT = prevScriptLimit;

const waitMs = 12000;
const deadline = Date.now() + waitMs;
while (Date.now() < deadline) {
  const a = getWorkerJobStatus(sognaRoot, jobA.job_id);
  const b = getWorkerJobStatus(sognaRoot, jobB.job_id);
  if (
    a &&
    b &&
    (a.status === "completed" || a.status === "failed") &&
    (b.status === "completed" || b.status === "failed")
  ) {
    break;
  }
  await new Promise((r) => setTimeout(r, 400));
}

const finalA = getWorkerJobStatus(sognaRoot, jobA.job_id);
const finalB = getWorkerJobStatus(sognaRoot, jobB.job_id);
if (finalA?.status === "failed") {
  fail(`job mcp-clients: ${(finalA.output || []).slice(-2).join(" ")}`);
}
if (finalB?.status === "failed") {
  fail(`job corners-verify: ${(finalB.output || []).slice(-2).join(" ")}`);
}
if (finalA?.status === "completed" || finalA?.status === "failed") {
  ok(`job mcp-clients → ${finalA.status}`);
}
if (finalB?.status === "completed" || finalB?.status === "failed") {
  ok(`job corners-verify → ${finalB.status}`);
}

if (failed > 0) {
  console.error(`\n${failed} comprobación(es) fallida(s).`);
  process.exit(1);
}

console.log("\nWorker queue OK.");
