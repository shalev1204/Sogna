#!/usr/bin/env node
/**
 * Cola de trabajos locales (scripts deterministas + Ollama). Persistencia en memory/.
 * Concurrencia acotada; doctor Ollama preflight en jobs kind=ollama.
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";
import {
  assertOllamaModelReady,
} from "./ollama-doctor.mjs";
import { buildDeptAgentProfileForTask } from "./dept-agent-bridge.mjs";
import { runDeptThink } from "../run-dept-think.mjs";
import { ollamaGenerate } from "./ollama-generate.mjs";
import { resolveOllamaModel } from "./ollama-routing.mjs";

/** @type {Record<string, { id: string; label: string; cmd: string; args: string[]; shell?: boolean }>} */
export const SCRIPT_REGISTRY = {
  "sentinel-audit": {
    id: "sentinel-audit",
    label: "Sentinel doctor audit",
    cmd: "python",
    args: ["Sentinel/Sentinel-doctor.py"],
  },
  "corners-verify": {
    id: "corners-verify",
    label: "Verify Capa 2 corners",
    cmd: "node",
    args: ["scripts/verify-corners.mjs"],
  },
  "mcp-clients": {
    id: "mcp-clients",
    label: "Verify MCP client configs",
    cmd: "node",
    args: ["scripts/verify-mcp-clients.mjs"],
  },
  "mcp-health": {
    id: "mcp-health",
    label: "MCP stack health",
    cmd: "node",
    args: ["scripts/verify-mcp-health.mjs"],
  },
  "mcp-doctor": {
    id: "mcp-doctor",
    label: "MCP doctor (config + contract + handshake)",
    cmd: "node",
    args: ["scripts/mcp-doctor.mjs"],
  },
  "mcp-contract": {
    id: "mcp-contract",
    label: "Verify MCP contract parity",
    cmd: "node",
    args: ["scripts/verify-mcp-contract.mjs"],
  },
  "mcp-observability": {
    id: "mcp-observability",
    label: "Verify MCP observability (P3)",
    cmd: "node",
    args: ["scripts/verify-mcp-observability.mjs"],
  },
  "mcp-handshake": {
    id: "mcp-handshake",
    label: "Verify MCP handshake + tools/list (P4)",
    cmd: "node",
    args: ["scripts/verify-mcp-handshake.mjs"],
  },
  "mcp-p5": {
    id: "mcp-p5",
    label: "Verify MCP P5 Ollama/UMA expansion",
    cmd: "node",
    args: ["scripts/verify-mcp-p5.mjs"],
  },
  "mcp-p6": {
    id: "mcp-p6",
    label: "Verify MCP P6 UMA watchdog + streamable",
    cmd: "node",
    args: ["scripts/verify-mcp-p6.mjs"],
  },
  "mcp-uma-recall": {
    id: "mcp-uma-recall",
    label: "Verify Sogna_UMA semantic_recall (FastMCP)",
    cmd: "node",
    args: ["scripts/verify-mcp-uma-recall.mjs"],
  },
  "mcp-amplifier": {
    id: "mcp-amplifier",
    label: "Verify MCP Amplifier tools (libs)",
    cmd: "node",
    args: ["scripts/verify-mcp-amplifier.mjs"],
  },
  "mcp-delegate": {
    id: "mcp-delegate",
    label: "Verify Delegate REST API (:8001, requiere sogna:on)",
    cmd: "node",
    args: ["scripts/verify-delegate-api.mjs"],
  },
  "dispatch-verify": {
    id: "dispatch-verify",
    label: "Verify dispatch / worker CLI",
    cmd: "node",
    args: ["scripts/verify-dispatch-cli.mjs"],
  },
  "worker-verify": {
    id: "worker-verify",
    label: "Verify worker queue (concurrencia, registry, doctor)",
    cmd: "node",
    args: ["scripts/verify-worker-queue.mjs"],
  },
  "ollama-doctor": {
    id: "ollama-doctor",
    label: "Ollama doctor (routing_rules vs modelos instalados)",
    cmd: "node",
    args: ["scripts/ollama-doctor.mjs", "--json"],
  },
  "uma-doctor": {
    id: "uma-doctor",
    label: "UMA identity doctor",
    cmd: "python",
    args: ["memory/identity/uma-doctor.py"],
  },
  "sognatore-doctor": {
    id: "sognatore-doctor",
    label: "Sognatore doctor JSON",
    cmd: "node",
    args: ["Curator/bin/sognatore.js", "doctor", "--json"],
  },
};

/**
 * @returns {{ script: number; ollama: number }}
 */
export function getWorkerLimits() {
  return {
    script: Math.max(1, parseInt(process.env.SOGNA_WORKER_MAX_SCRIPT || "2", 10) || 2),
    ollama: Math.max(1, parseInt(process.env.SOGNA_WORKER_MAX_OLLAMA || "1", 10) || 1),
  };
}

/** @deprecated Use getWorkerLimits() — snapshot al cargar el módulo */
export const WORKER_LIMITS = getWorkerLimits();

/** @type {{ scriptRunning: number; ollamaRunning: number; processing: boolean; reconciled: boolean }} */
const runtime = {
  scriptRunning: 0,
  ollamaRunning: 0,
  processing: false,
  reconciled: false,
};

/**
 * @returns {{ scriptRunning: number; ollamaRunning: number; limits: typeof WORKER_LIMITS }}
 */
export function getWorkerRuntimeState() {
  const limits = getWorkerLimits();
  return {
    scriptRunning: runtime.scriptRunning,
    ollamaRunning: runtime.ollamaRunning,
    limits,
  };
}

/**
 * @param {string} sognaRoot
 */
function jobsFile(sognaRoot) {
  const dir = path.join(sognaRoot, "memory", "operational", "agent");
  mkdirSync(dir, { recursive: true });
  return path.join(dir, "worker_jobs.json");
}

/**
 * @param {string} sognaRoot
 */
function loadStore(sognaRoot) {
  const file = jobsFile(sognaRoot);
  if (!existsSync(file)) return { jobs: [] };
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return { jobs: [] };
  }
}

/**
 * @param {string} sognaRoot
 * @param {{ jobs: unknown[] }} store
 */
function saveStore(sognaRoot, store) {
  writeFileSync(jobsFile(sognaRoot), JSON.stringify(store, null, 2) + "\n", "utf8");
}

/**
 * Reencola jobs interrumpidos (p. ej. tras reinicio del Bridge).
 * @param {string} sognaRoot
 */
export function reconcileInterruptedJobs(sognaRoot) {
  const store = loadStore(sognaRoot);
  let changed = false;
  for (const job of store.jobs) {
    if (job.status === "running") {
      job.status = "queued";
      job.output = job.output || [];
      job.output.push("RECONCILE: reencolado tras interrupción del worker.");
      job.updated_at = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) saveStore(sognaRoot, store);
}

/**
 * @param {string} sognaRoot
 */
export function listWorkerJobs(sognaRoot) {
  const store = loadStore(sognaRoot);
  return store.jobs.slice(-50).reverse();
}

/**
 * @param {string} sognaRoot
 * @param {string} jobId
 */
export function getWorkerJobStatus(sognaRoot, jobId) {
  const store = loadStore(sognaRoot);
  return store.jobs.find((j) => j.id === jobId) || null;
}

/**
 * @param {"script"|"ollama"|"dept"} kind
 */
function hasCapacity(kind) {
  const limits = getWorkerLimits();
  if (kind === "script") return runtime.scriptRunning < limits.script;
  if (kind === "ollama" || kind === "dept") return runtime.ollamaRunning < limits.ollama;
  return false;
}

/**
 * @param {string} sognaRoot
 */
function processQueue(sognaRoot) {
  if (!runtime.reconciled) {
    reconcileInterruptedJobs(sognaRoot);
    runtime.reconciled = true;
  }
  if (runtime.processing) return;
  runtime.processing = true;

  try {
    const store = loadStore(sognaRoot);
    const queued = store.jobs.filter((j) => j.status === "queued");
    let startedAny = false;

    for (const job of queued) {
      const kind = /** @type {"script"|"ollama"|"dept"} */ (job.kind);
      if (!hasCapacity(kind)) continue;

      if (kind === "script") runtime.scriptRunning += 1;
      else runtime.ollamaRunning += 1;

      startedAny = true;
      runJob(sognaRoot, job.id)
        .catch(() => {})
        .finally(() => {
          if (kind === "script") runtime.scriptRunning -= 1;
          else runtime.ollamaRunning -= 1;
          runtime.processing = false;
          processQueue(sognaRoot);
        });
    }

    if (!startedAny) runtime.processing = false;
  } catch {
    runtime.processing = false;
  }
}

/**
 * @param {string} sognaRoot
 * @param {object} opts
 * @param {"script"|"ollama"|"dept"} opts.kind
 * @param {string} [opts.action]
 * @param {string} [opts.task]
 * @param {string} [opts.tier]
 * @param {string} [opts.agent_id]
 * @param {string} [opts.model]
 */
export function enqueueWorkerJob(sognaRoot, opts) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const id = randomUUID();
  const now = new Date().toISOString();

  /** @type {Record<string, unknown>} */
  const job = {
    id,
    kind: opts.kind,
    status: "queued",
    created_at: now,
    updated_at: now,
    tier: opts.tier || null,
    action: opts.action || null,
    task: opts.task || null,
    agent_id: opts.agent_id || null,
    model: opts.model || null,
    output: [],
    exit_code: null,
    intelligence_mode: cfg.intelligence.mode,
    worker_limits: { ...getWorkerLimits() },
  };

  const store = loadStore(sognaRoot);
  store.jobs.push(job);
  if (store.jobs.length > 200) store.jobs = store.jobs.slice(-200);
  saveStore(sognaRoot, store);

  setImmediate(() => processQueue(sognaRoot));

  const limits = getWorkerLimits();
  return {
    job_id: id,
    status: "queued",
    message: `Job ${id} encolado (límites: script=${limits.script}, ollama=${limits.ollama}).`,
  };
}

/**
 * @param {string} sognaRoot
 * @param {string} jobId
 */
async function runJob(sognaRoot, jobId) {
  const store = loadStore(sognaRoot);
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job || job.status !== "queued") return;

  job.status = "running";
  job.updated_at = new Date().toISOString();
  saveStore(sognaRoot, store);

  try {
    if (job.kind === "script") {
      await runScriptJob(sognaRoot, job);
    } else if (job.kind === "ollama") {
      await runOllamaJob(sognaRoot, job);
    } else if (job.kind === "dept") {
      await runDeptJob(sognaRoot, job);
    } else {
      throw new Error(`Unknown job kind: ${job.kind}`);
    }
    job.status = "completed";
    job.exit_code = 0;
  } catch (e) {
    job.status = "failed";
    job.exit_code = job.exit_code ?? 1;
    job.output.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
  }

  job.updated_at = new Date().toISOString();
  saveStore(sognaRoot, store);
}

/**
 * @param {string} sognaRoot
 * @param {Record<string, unknown>} job
 */
function persistJob(sognaRoot, job) {
  const store = loadStore(sognaRoot);
  const idx = store.jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    store.jobs[idx] = { ...store.jobs[idx], ...job, output: [...(job.output || [])] };
    saveStore(sognaRoot, store);
  }
}

/**
 * @param {string} sognaRoot
 * @param {Record<string, unknown>} job
 */
function runScriptJob(sognaRoot, job) {
  const action = String(job.action || "");
  const entry = SCRIPT_REGISTRY[action];
  if (!entry) {
    throw new Error(
      `Acción no permitida: ${action}. Use: ${Object.keys(SCRIPT_REGISTRY).join(", ")}`,
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(entry.cmd, entry.args, {
      cwd: sognaRoot,
      shell: entry.shell ?? false,
      windowsHide: true,
      env: { ...process.env, SOGNA_LOCAL_MODE: "true", SOGNATORE_KEYLESS: "true" },
    });

    const append = (line) => {
      if (!line.trim()) return;
      job.output = job.output || [];
      job.output.push(line);
      if (job.output.length > 300) job.output = job.output.slice(-300);
      job.updated_at = new Date().toISOString();
      persistJob(sognaRoot, job);
    };

    child.stdout?.on("data", (d) => append(d.toString()));
    child.stderr?.on("data", (d) => append(d.toString()));
    child.on("close", (code) => {
      job.exit_code = code ?? 1;
      persistJob(sognaRoot, job);
      if (code === 0) resolve(undefined);
      else reject(new Error(`Script ${action} exit ${code}`));
    });
    child.on("error", reject);
  });
}

/**
 * @param {string} sognaRoot
 * @param {Record<string, unknown>} job
 */
async function runOllamaJob(sognaRoot, job) {
  const taskText = String(job.task || "");
  const override = job.model ? String(job.model) : undefined;
  const { model, task_type: taskType, source } = resolveOllamaModel(sognaRoot, taskText, override);

  const ready = await assertOllamaModelReady(sognaRoot, model);
  job.model = model;
  job.task_type = taskType;
  job.model_source = source;
  persistJob(sognaRoot, job);

  if (!ready.ok) {
    throw new Error(ready.message);
  }

  const prompt = [
    "Eres un worker local de Sognatore (modo offline, sin API cloud).",
    "Responde en español técnico, estructurado y verificable.",
    "Tarea:",
    taskText,
  ].join("\n");

  const timeoutMs = Math.max(
    15000,
    parseInt(process.env.SOGNA_OLLAMA_JOB_TIMEOUT_MS || "90000", 10) || 90000,
  );
  const gen = await ollamaGenerate(model, prompt, { timeoutMs });
  job.exit_code = gen.ok ? 0 : 1;
  job.output = job.output || [];
  if (gen.ok && gen.output) {
    job.output.push(gen.output);
  } else {
    job.output.push(`ERROR: ${gen.error || "Ollama sin salida"}`);
  }
  if (job.output.length > 300) job.output = job.output.slice(-300);
  job.updated_at = new Date().toISOString();
  persistJob(sognaRoot, job);
  if (!gen.ok) {
    throw new Error(gen.error || "Ollama job falló");
  }
}

/**
 * Job kind=dept — mismo contrato que DeptAgentRuntime (perfil + prompt + Ollama).
 * @param {string} sognaRoot
 * @param {Record<string, unknown>} job
 */
async function runDeptJob(sognaRoot, job) {
  const agentId = String(job.agent_id || "");
  const taskText = String(job.task || "");

  if (!agentId) throw new Error("agent_id requerido para kind=dept");
  if (!taskText) throw new Error("task requerido para kind=dept");

  const built = buildDeptAgentProfileForTask(sognaRoot, agentId, taskText);
  if (built.error || !built.profile) {
    throw new Error(built.error || `Agente no resuelto: ${agentId}`);
  }

  job.dept_runtime = built.profile;
  job.model_route = built.model_route;
  persistJob(sognaRoot, job);

  const result = await runDeptThink(sognaRoot, agentId, taskText, { json: true });
  if (!result.ok) {
    throw new Error(result.error || "runDeptThink falló");
  }

  job.output = job.output || [];
  job.output.push(String(result.output || ""));
  job.model = result.model_route?.model;
  job.invoke_tier = result.invoke_tier;
  persistJob(sognaRoot, job);
}
