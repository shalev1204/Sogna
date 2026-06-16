#!/usr/bin/env node
/**
 * Cola de trabajos locales (scripts deterministas + Ollama). Persistencia en memory/.
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
import { detectTaskType } from "./task-router.mjs";

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

const DEFAULT_MODELS = {
  coding: "deepseek-coder-v2:lite",
  debugging: "qwen2.5-coder:7b",
  testing: "qwen2.5-coder:7b",
  documentation: "gemma2:9b",
  architecture: "gemma2:9b",
  security: "qwen2.5-coder:7b",
  system: "llama3.1:latest",
};

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
 * @param {string} sognaRoot
 * @param {object} opts
 * @param {"script"|"ollama"} opts.kind
 * @param {string} [opts.action]
 * @param {string} [opts.task]
 * @param {string} [opts.tier]
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
    output: [],
    exit_code: null,
    intelligence_mode: cfg.intelligence.mode,
  };

  const store = loadStore(sognaRoot);
  store.jobs.push(job);
  if (store.jobs.length > 200) store.jobs = store.jobs.slice(-200);
  saveStore(sognaRoot, store);

  setImmediate(() => runJob(sognaRoot, id));

  return { job_id: id, status: "queued", message: `Job ${id} encolado.` };
}

/**
 * @param {string} sognaRoot
 * @param {string} jobId
 */
async function runJob(sognaRoot, jobId) {
  const store = loadStore(sognaRoot);
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return;

  job.status = "running";
  job.updated_at = new Date().toISOString();
  saveStore(sognaRoot, store);

  try {
    if (job.kind === "script") {
      await runScriptJob(sognaRoot, job);
    } else if (job.kind === "ollama") {
      await runOllamaJob(sognaRoot, job);
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
    throw new Error(`Acción no permitida: ${action}. Use: ${Object.keys(SCRIPT_REGISTRY).join(", ")}`);
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
function runOllamaJob(sognaRoot, job) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const taskText = String(job.task || "");
  const taskType = detectTaskType(taskText);
  let model = DEFAULT_MODELS[taskType] || DEFAULT_MODELS.system;

  const rule = cfg.intelligence.routing_rules?.[taskType];
  if (typeof rule === "string" && rule.includes(":")) {
    const parts = rule.split(":");
    if (parts[0] === "ollama") model = parts.slice(1).join(":");
  }

  const prompt = [
    "Eres un worker local de Sognatore (modo offline, sin API cloud).",
    "Responde en español técnico, estructurado y verificable.",
    "Tarea:",
    taskText,
  ].join("\n");

  return new Promise((resolve, reject) => {
    const child = spawn("ollama", ["run", model, prompt], {
      cwd: sognaRoot,
      shell: false,
      windowsHide: true,
      env: process.env,
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
      job.model = model;
      persistJob(sognaRoot, job);
      if (code === 0) resolve(undefined);
      else reject(new Error(`Ollama exit ${code}`));
    });
    child.on("error", (err) => {
      reject(new Error(`Ollama no disponible: ${err.message}`));
    });
  });
}
