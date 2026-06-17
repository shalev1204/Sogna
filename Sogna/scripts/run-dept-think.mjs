#!/usr/bin/env node
/**
 * Ejecuta think departamental alineado con DeptAgentRuntime (Ollama local).
 * Usado por worker kind=dept y verificación del puente route → runtime.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDeptAgentProfileForTask,
  buildDeptSystemPrompt,
} from "./lib/dept-agent-bridge.mjs";
import { ollamaGenerate } from "./lib/ollama-generate.mjs";
import {
  DEFAULT_OLLAMA_MODELS,
  isModelInstalled,
  runOllamaDoctor,
} from "./lib/ollama-doctor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");

/**
 * @param {string} root
 * @param {string} agentId
 * @param {string} task
 * @param {{ json?: boolean }} [opts]
 */
export async function runDeptThink(root, agentId, task, opts = {}) {
  const built = buildDeptAgentProfileForTask(root, agentId, task);

  if (built.error || !built.profile) {
    const err = built.error || `Perfil no resuelto para ${agentId}`;
    if (opts.json) {
      return { ok: false, error: err, available: built.available || [] };
    }
    throw new Error(err);
  }

  const { profile, model_route: modelRoute } = built;
  const prompt = `${buildDeptSystemPrompt(profile)}\n\nTask:\n${task}`;

  const baseTimeoutMs = Math.max(
    15000,
    parseInt(process.env.SOGNA_DEPT_THINK_TIMEOUT_MS || "90000", 10) || 90000,
  );
  const retries = Math.max(0, parseInt(process.env.SOGNA_DEPT_THINK_RETRIES || "2", 10) || 2);
  const maxAttempts = retries + 1;

  const doctor = await runOllamaDoctor(root);
  if (!doctor.ollama_available) {
    const err = doctor.message || "Ollama no disponible";
    if (opts.json) return { ok: false, error: err, profile, model_route: modelRoute };
    throw new Error(err);
  }

  const envFallback = String(process.env.SOGNA_DEPT_FALLBACK_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const fallbackModels = envFallback.length
    ? envFallback
    : [DEFAULT_OLLAMA_MODELS.coding, DEFAULT_OLLAMA_MODELS.system];
  const modelCandidates = [modelRoute.model, ...fallbackModels].filter(
    (m, i, arr) => m && arr.indexOf(m) === i,
  );

  let output = "";
  let lastError = null;
  let usedModel = modelRoute.model;
  for (const model of modelCandidates) {
    if (!isModelInstalled(model, doctor.installed_models || [])) {
      lastError = new Error(`Modelo "${model}" no instalado. Ejecute: ollama pull ${model}`);
      continue;
    }
    const attemptsForModel = model === modelRoute.model ? 1 : maxAttempts;
    for (let attempt = 1; attempt <= attemptsForModel; attempt += 1) {
      const timeoutMs = Math.round(baseTimeoutMs * (1 + (attempt - 1) * 0.75));
      const gen = await ollamaGenerate(model, prompt, { timeoutMs });
      if (gen.ok && gen.output) {
        output = gen.output;
        usedModel = gen.model || model;
        lastError = null;
        break;
      }
      lastError = new Error(gen.error || `Ollama sin salida (modelo ${model})`);
      const timeoutErr = String(gen.error || "").includes("timeout");
      if (!timeoutErr || attempt === attemptsForModel) {
        break;
      }
    }
    if (!lastError) break;
  }
  if (lastError) throw lastError;

  const result = {
    ok: true,
    agent_id: agentId,
    profile,
    model_route: { ...modelRoute, model: usedModel },
    invoke_tier: profile.invoke_tier,
    output,
  };

  if (opts.json) return result;
  return output;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const agentIdx = args.indexOf("--agent");
  const taskIdx = args.indexOf("--task");
  const agentId = agentIdx >= 0 ? args[agentIdx + 1] : "";
  const task = taskIdx >= 0 ? args[taskIdx + 1] : "";

  if (!agentId || !task) {
    console.error("Uso: node scripts/run-dept-think.mjs --agent <id> --task <texto> [--json]");
    process.exit(1);
  }

  try {
    const result = await runDeptThink(sognaRoot, agentId, task, { json });
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    }
    process.exit(result && typeof result === "object" && "ok" in result && !result.ok ? 1 : 0);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
