#!/usr/bin/env node
/**
 * Migración Chroma → Supabase pgvector (embeddings preservados).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { sognaRoot } from "./corners-lib.mjs";
import { loadSognaDotenv } from "./lib/load-dotenv.mjs";
import { ensurePythonUma, resolvePythonExecutable } from "./lib/toolchain-bootstrap.mjs";

loadSognaDotenv(sognaRoot);

const forceReindex = process.argv.includes("--force-reindex");

const uma = ensurePythonUma(sognaRoot);
if (!uma.ok) {
  console.error("[FAIL] Toolchain Python:", uma.detail);
  process.exit(1);
}

const python = uma.python ?? resolvePythonExecutable(sognaRoot);
const args = [path.join(sognaRoot, "memory", "identity", "migrate_chroma_to_supabase.py")];
if (forceReindex) args.push("--force-reindex");

const r = spawnSync(python, args, {
  cwd: sognaRoot,
  encoding: "utf8",
  env: {
    ...process.env,
    SOGNA_VECTOR_PROVIDER: "supabase",
  },
  stdio: "inherit",
  maxBuffer: 50 * 1024 * 1024,
});

process.exit(r.status ?? 1);
