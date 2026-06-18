#!/usr/bin/env node
/**
 * Bootstrap ChromaDB local (por máquina). Ejecuta index_uma.py si falta la BD.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
  const isWin = process.platform === "win32";
  const candidates = isWin
    ? [path.join(sognaRoot, ".venv", "Scripts", "python.exe")]
    : [
        path.join(sognaRoot, ".venv", "bin", "python3"),
        path.join(sognaRoot, ".venv", "bin", "python"),
      ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return isWin ? "python" : "python3";
}

/**
 * @param {string} sognaRoot
 * @param {{ force?: boolean }} [opts]
 */
export function ensureChromaBootstrap(sognaRoot, opts = {}) {
  const chromaDir = resolveChromaDir(sognaRoot);
  const status = isChromaReady(chromaDir);

  if (status.ready && !opts.force) {
    return { ok: true, action: "skip", detail: status.reason, chromaDir };
  }

  const python = resolvePython(sognaRoot);
  const indexScript = path.join(sognaRoot, "memory", "identity", "index_uma.py");
  if (!existsSync(indexScript)) {
    return { ok: false, action: "fail", detail: "index_uma.py no encontrado", chromaDir };
  }

  const r = spawnSync(python, [indexScript], {
    cwd: sognaRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (r.stdout?.trim()) process.stdout.write(r.stdout);
  if (r.stderr?.trim()) process.stderr.write(r.stderr);

  if (r.status !== 0) {
    return {
      ok: false,
      action: "fail",
      detail: `index_uma.py exit ${r.status ?? 1}`,
      chromaDir,
    };
  }

  const after = isChromaReady(chromaDir);
  if (!after.ready) {
    return { ok: false, action: "fail", detail: "indexación sin chroma.sqlite3 válido", chromaDir };
  }

  return {
    ok: true,
    action: opts.force ? "reindex" : "index",
    detail: after.reason,
    chromaDir,
  };
}
