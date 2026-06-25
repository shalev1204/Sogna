#!/usr/bin/env node
/**
 * Doctor Ollama: versión del daemon, modelos instalados vs routing_rules en .sognarc.json.
 */
import { spawn } from "node:child_process";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";

/** @type {Record<string, string>} */
export const DEFAULT_OLLAMA_MODELS = {
  coding: "deepseek-coder-v2:lite",
  debugging: "qwen2.5-coder:7b",
  testing: "qwen2.5-coder:7b",
  documentation: "gemma2:9b",
  architecture: "gemma2:9b",
  security: "qwen2.5-coder:7b",
  system: "llama3.1:latest",
};

/**
 * Modelos de fallback en orden de prioridad, usados cuando el modelo primario
 * no está instalado. gemma4:31b siempre está disponible como último recurso.
 * @type {string[]}
 */
export const FALLBACK_OLLAMA_MODELS = [
  "llama3.1:latest",
  "gemma4:31b",
];

/**
 * @returns {number}
 */
function getOllamaDoctorTimeoutMs() {
  return Math.max(
    3000,
    parseInt(process.env.SOGNA_OLLAMA_DOCTOR_TIMEOUT_MS || "10000", 10) || 10000,
  );
}

/**
 * @param {import("node:child_process").ChildProcess} child
 */
function terminateChildProcess(child) {
  if (!child?.pid) return;
  try {
    child.kill("SIGTERM");
  } catch {}
  if (process.platform === "win32") {
    try {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
      killer.unref();
    } catch {}
  } else {
    setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {}
    }, 1200).unref();
  }
}

/**
 * @param {string[]} args
 * @returns {Promise<{ ok: boolean; code: number; out: string; err: string; timeout: boolean }>}
 */
function runOllamaCommand(args) {
  const timeoutMs = getOllamaDoctorTimeoutMs();
  return new Promise((resolve) => {
    const child = spawn("ollama", args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      terminateChildProcess(child);
      resolve({
        ok: false,
        code: 124,
        out,
        err: `Timeout tras ${timeoutMs}ms: ollama ${args.join(" ")}`,
        timeout: true,
      });
    }, timeoutMs);
    child.stdout?.on("data", (d) => {
      out += d.toString();
    });
    child.stderr?.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: code === 0, code: code ?? 1, out, err, timeout: false });
    });
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, code: 1, out, err: e.message, timeout: false });
    });
  });
}

/**
 * @param {string} sognaRoot
 * @returns {string[]}
 */
export function collectRequiredOllamaModels(sognaRoot) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const rules = cfg.intelligence.routing_rules || {};
  /** @type {Set<string>} */
  const models = new Set();

  for (const [taskType, rule] of Object.entries(rules)) {
    if (typeof rule === "string" && rule.startsWith("ollama:")) {
      const name = rule.slice("ollama:".length).trim();
      if (name) models.add(name);
      continue;
    }
    const fallback = DEFAULT_OLLAMA_MODELS[taskType];
    if (fallback) models.add(fallback);
  }

  if (models.size === 0) {
    for (const m of Object.values(DEFAULT_OLLAMA_MODELS)) models.add(m);
  }

  return [...models].sort();
}

/**
 * @param {string} stdout
 * @returns {string[]}
 */
export function parseOllamaList(stdout) {
  const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const names = [];
  for (const line of lines.slice(1)) {
    const name = line.split(/\s+/)[0];
    if (name && name !== "NAME") names.push(name);
  }
  return names;
}

/**
 * @param {string} model
 * @param {string[]} installed
 */
export function isModelInstalled(model, installed) {
  if (installed.includes(model)) return true;
  const base = model.split(":")[0];
  return installed.some((n) => n === model || n.startsWith(`${base}:`) || n.split(":")[0] === base);
}

/**
 * @returns {Promise<{ ok: boolean; version?: string; error?: string }>}
 */
export async function checkOllamaVersion() {
  const res = await runOllamaCommand(["--version"]);
  if (res.ok) {
    return { ok: true, version: (res.out || res.err).trim() };
  }
  if (res.timeout) {
    return {
      ok: false,
      error: "Timeout al consultar `ollama --version`. Verifique que el daemon esté vivo.",
    };
  }
  if (res.err?.includes("ENOENT")) {
    return {
      ok: false,
      error: "Ejecutable `ollama` no encontrado en PATH.",
    };
  }
  return {
    ok: false,
    error: "Ollama no responde a `ollama --version`. Instale Ollama o arranque el servicio.",
  };
}

/**
 * @returns {Promise<{ ok: boolean; models: string[]; error?: string }>}
 */
export async function listInstalledOllamaModels() {
  const res = await runOllamaCommand(["list"]);
  if (!res.ok) {
    return {
      ok: false,
      models: [],
      error: res.timeout ? res.err : res.err.trim() || "ollama list falló",
    };
  }
  return { ok: true, models: parseOllamaList(res.out) };
}

/**
 * @param {string} sognaRoot
 * @param {{ strict?: boolean }} [opts]
 * @returns {Promise<{
 *   ok: boolean;
 *   ollama_available: boolean;
 *   version: string | null;
 *   required_models: string[];
 *   installed_models: string[];
 *   missing_models: string[];
 *   pull_hints: string[];
 *   message: string;
 * }>}
 */
export async function runOllamaDoctor(sognaRoot, opts = {}) {
  const required = collectRequiredOllamaModels(sognaRoot);
  const versionCheck = await checkOllamaVersion();

  if (!versionCheck.ok) {
    return {
      ok: false,
      ollama_available: false,
      version: null,
      required_models: required,
      installed_models: [],
      missing_models: required,
      pull_hints: required.map((m) => `ollama pull ${m}`),
      message: versionCheck.error || "Ollama no disponible.",
    };
  }

  const listCheck = await listInstalledOllamaModels();
  if (!listCheck.ok) {
    return {
      ok: false,
      ollama_available: true,
      version: versionCheck.version || null,
      required_models: required,
      installed_models: [],
      missing_models: required,
      pull_hints: required.map((m) => `ollama pull ${m}`),
      message: listCheck.error || "No se pudo listar modelos Ollama.",
    };
  }

  const installed = listCheck.models;
  const missing = required.filter((m) => !isModelInstalled(m, installed));
  const ok = opts.strict ? missing.length === 0 : missing.length === 0;

  let message;
  if (missing.length === 0) {
    message = `Ollama OK (${versionCheck.version}). ${required.length} modelo(s) de routing presentes.`;
  } else {
    message = `Faltan ${missing.length} modelo(s): ${missing.join(", ")}. Ejecute: ${missing.map((m) => `ollama pull ${m}`).join("; ")}`;
  }

  return {
    ok,
    ollama_available: true,
    version: versionCheck.version || null,
    required_models: required,
    installed_models: installed,
    missing_models: missing,
    pull_hints: missing.map((m) => `ollama pull ${m}`),
    message,
  };
}

/**
 * @param {string} sognaRoot
 * @param {string} model
 * @returns {Promise<{ ok: boolean; model: string; message: string }>}
 */
export async function assertOllamaModelReady(sognaRoot, model) {
  const doctor = await runOllamaDoctor(sognaRoot);
  if (!doctor.ollama_available) {
    return { ok: false, model, message: doctor.message };
  }
  if (!isModelInstalled(model, doctor.installed_models)) {
    return {
      ok: false,
      model,
      message: `Modelo "${model}" no instalado. Ejecute: ollama pull ${model}`,
    };
  }
  return { ok: true, model, message: `Modelo "${model}" disponible.` };
}
