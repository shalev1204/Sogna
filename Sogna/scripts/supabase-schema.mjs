#!/usr/bin/env node
/**
 * Aplica esquema uma_embeddings + extensión pgvector en Supabase.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { sognaRoot } from "./corners-lib.mjs";
import { loadSognaDotenv } from "./lib/load-dotenv.mjs";
import { resolvePythonExecutable } from "./lib/toolchain-bootstrap.mjs";

loadSognaDotenv(sognaRoot);

const python =
  resolvePythonExecutable(sognaRoot) ?? (process.platform === "win32" ? "python" : "python3");
const r = spawnSync(
  python,
  [path.join(sognaRoot, "memory", "identity", "supabase_probe.py"), "schema"],
  { cwd: sognaRoot, encoding: "utf8", env: { ...process.env }, stdio: "inherit" },
);

process.exit(r.status ?? 1);
