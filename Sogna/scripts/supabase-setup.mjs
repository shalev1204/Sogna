#!/usr/bin/env node
/**
 * Comprueba variables Supabase en .env y conectividad Postgres/pgvector.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sognaRoot } from "./corners-lib.mjs";
import { loadSognaDotenv } from "./lib/load-dotenv.mjs";
import { resolvePythonExecutable } from "./lib/toolchain-bootstrap.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadSognaDotenv(sognaRoot);

const REQUIRED = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_DB_URL"];
const RECOMMENDED = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_DIRECT_URL"];

console.log("══════════════════════════════════════════════════");
console.log(" SOGNA — Supabase setup (F0)");
console.log("══════════════════════════════════════════════════\n");

let fail = false;
for (const key of REQUIRED) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`  ${ok ? "✓" : "✗"} ${key}`);
  if (!ok) fail = true;
}
for (const key of RECOMMENDED) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`  ${ok ? "✓" : "○"} ${key} (recomendada)`);
}

if (fail) {
  console.log("\n[FALTA CONFIG] Complete Sogna/.env siguiendo la guía del Operador.");
  console.log("  Dashboard → Project Settings → API (URL + keys)");
  console.log("  Dashboard → Database → Connection string → URI");
  process.exit(1);
}

const python =
  resolvePythonExecutable(sognaRoot) ?? (process.platform === "win32" ? "python" : "python3");
const probe = spawnSync(python, [path.join(sognaRoot, "memory", "identity", "supabase_probe.py"), "probe"], {
  cwd: sognaRoot,
  encoding: "utf8",
  env: { ...process.env },
});

if (probe.stdout) process.stdout.write(probe.stdout);
if (probe.stderr) process.stderr.write(probe.stderr);

if (probe.status !== 0) {
  console.log("\n[PASO SIGUIENTE] pnpm supabase:schema");
  process.exit(probe.status ?? 1);
}

console.log("\n[OK] Supabase operativo para UMA pgvector");
process.exit(0);
