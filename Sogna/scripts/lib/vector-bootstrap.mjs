#!/usr/bin/env node
/**
 * Bootstrap del índice vectorial UMA (pgvector o Chroma legacy).
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadSognaDotenv } from "./load-dotenv.mjs";
import { resolvePythonExecutable } from "./toolchain-bootstrap.mjs";

/** @typedef {{ provider: string; target: string }} VectorConfig */

/**
 * @param {string} sognaRoot
 * @returns {VectorConfig}
 */
export function resolveVectorConfig(sognaRoot) {
  const registryPath = path.join(sognaRoot, "memory", "identity", "registry.json");
  let provider = "auto";
  let target = "supabase_pgvector";
  if (existsSync(registryPath)) {
    try {
      const registry = JSON.parse(readFileSync(registryPath, "utf8"));
      const vs = registry?.vector_store ?? {};
      provider = vs.provider ?? "auto";
      target = vs.target_provider ?? "supabase_pgvector";
    } catch {
      /* default */
    }
  }
  if (process.env.SOGNA_VECTOR_PROVIDER) {
    provider = process.env.SOGNA_VECTOR_PROVIDER;
  }
  return { provider, target };
}

/**
 * @param {string} sognaRoot
 */
export function resolveChromaDir(sognaRoot) {
  const registryPath = path.join(sognaRoot, "memory", "identity", "registry.json");
  let rel = "operational/vectors/chroma";
  if (existsSync(registryPath)) {
    try {
      const registry = JSON.parse(readFileSync(registryPath, "utf8"));
      rel = registry?.vector_store?.path ?? rel;
    } catch {
      /* default */
    }
  }
  return path.join(sognaRoot, "memory", rel.replace(/^memory\//, ""));
}

/**
 * @param {string} chromaDir
 */
export function isChromaReady(chromaDir) {
  const sqlite = path.join(chromaDir, "chroma.sqlite3");
  if (!existsSync(sqlite)) return { ready: false, reason: "chroma.sqlite3 ausente" };
  try {
    const size = statSync(sqlite).size;
    if (size < 4096) return { ready: false, reason: "chroma.sqlite3 vacío o corrupto" };
    return { ready: true, reason: `chroma.sqlite3 (${Math.round(size / 1024)} KB)` };
  } catch {
    return { ready: false, reason: "no se pudo leer chroma.sqlite3" };
  }
}

/**
 * @param {string} sognaRoot
 */
export function resolvePython(sognaRoot) {
  return (
    resolvePythonExecutable(sognaRoot) ?? (process.platform === "win32" ? "python" : "python3")
  );
}

/**
 * @param {string} sognaRoot
 */
export function probeVectorReady(sognaRoot) {
  loadSognaDotenv(sognaRoot);
  const python = resolvePython(sognaRoot);
  const script = path.join(sognaRoot, "memory", "identity", "vector_store.py");
  const r = spawnSync(python, [script], {
    cwd: sognaRoot,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env },
  });
  const line = (r.stdout || r.stderr || "").trim().split("\n").pop() || "";
  const ready = line.includes("ready=True");
  return { ready, detail: line || `vector_store.py exit ${r.status ?? 1}`, python };
}

/**
 * @param {string} sognaRoot
 * @param {{ force?: boolean }} [opts]
 */
export function ensureVectorBootstrap(sognaRoot, opts = {}) {
  loadSognaDotenv(sognaRoot);
  const { provider, target } = resolveVectorConfig(sognaRoot);
  const probe = probeVectorReady(sognaRoot);

  if (probe.ready && !opts.force) {
    return {
      ok: true,
      action: "skip",
      detail: probe.detail,
      provider,
      target,
      chromaDir: resolveChromaDir(sognaRoot),
    };
  }

  const python = resolvePython(sognaRoot);
  const indexScript = path.join(sognaRoot, "memory", "identity", "index_uma.py");
  if (!existsSync(indexScript)) {
    return {
      ok: false,
      action: "fail",
      detail: "index_uma.py no encontrado",
      provider,
      target,
      chromaDir: resolveChromaDir(sognaRoot),
    };
  }

  const r = spawnSync(python, [indexScript], {
    cwd: sognaRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env },
  });

  if (r.stdout?.trim()) process.stdout.write(r.stdout);
  if (r.stderr?.trim()) process.stderr.write(r.stderr);

  if (r.status !== 0) {
    return {
      ok: false,
      action: "fail",
      detail: `index_uma.py exit ${r.status ?? 1}`,
      provider,
      target,
      chromaDir: resolveChromaDir(sognaRoot),
    };
  }

  const after = probeVectorReady(sognaRoot);
  if (!after.ready) {
    return {
      ok: false,
      action: "fail",
      detail: `indexación sin índice válido — ${after.detail}`,
      provider,
      target,
      chromaDir: resolveChromaDir(sognaRoot),
    };
  }

  return {
    ok: true,
    action: opts.force ? "reindex" : "index",
    detail: after.detail,
    provider,
    target,
    chromaDir: resolveChromaDir(sognaRoot),
  };
}

/** @deprecated use ensureVectorBootstrap */
export function ensureChromaBootstrap(sognaRoot, opts = {}) {
  return ensureVectorBootstrap(sognaRoot, opts);
}
