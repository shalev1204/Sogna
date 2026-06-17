#!/usr/bin/env node
/**
 * Verificación MCP para CI — sin servicios locales ni escritura en ~/.cursor.
 * Doctor (modo CI) + artefacto Bridge + verify-mcp-amplifier (libs).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

console.log("=== MCP CI verify ===\n");

const bridgeBuild = path.join(sognaRoot, "engines", "MCP-Bridge", "build", "index.js");
if (existsSync(bridgeBuild)) {
  ok("MCP-Bridge build/index.js presente");
} else {
  fail("MCP-Bridge build/index.js ausente (ejecute pnpm --filter sogna build)");
}

const doctor = spawnSync("node", ["scripts/mcp-doctor.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: { ...process.env, SOGNA_MCP_DOCTOR_CI: "1" },
});
if (doctor.stdout?.trim()) process.stdout.write(doctor.stdout);
if (doctor.stderr?.trim()) process.stderr.write(doctor.stderr);
if (doctor.status === 0) ok("mcp-doctor (CI)");
else fail("mcp-doctor (CI)");

const amplifier = spawnSync("node", ["scripts/verify-mcp-amplifier.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: { ...process.env, SOGNA_SKIP_DEPT_JOB: "1", SOGNA_SKIP_DEPT_LLM: "1" },
});
if (amplifier.stdout?.trim()) process.stdout.write(amplifier.stdout);
if (amplifier.status === 0) ok("verify-mcp-amplifier (libs)");
else {
  if (amplifier.stderr?.trim()) process.stderr.write(amplifier.stderr);
  fail("verify-mcp-amplifier");
}

const observability = spawnSync("node", ["scripts/verify-mcp-observability.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: { ...process.env, SOGNA_MCP_OBS_SKIP_RUNTIME: "1" },
});
if (observability.stdout?.trim()) process.stdout.write(observability.stdout);
if (observability.status === 0) ok("verify-mcp-observability (P3 static)");
else {
  if (observability.stderr?.trim()) process.stderr.write(observability.stderr);
  fail("verify-mcp-observability");
}

const handshake = spawnSync("node", ["scripts/verify-mcp-handshake.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: { ...process.env, SOGNA_MCP_HANDSHAKE_SKIP_RUNTIME: "1" },
});
if (handshake.stdout?.trim()) process.stdout.write(handshake.stdout);
if (handshake.status === 0) ok("verify-mcp-handshake (P4 static)");
else {
  if (handshake.stderr?.trim()) process.stderr.write(handshake.stderr);
  fail("verify-mcp-handshake");
}

const p5 = spawnSync("node", ["scripts/verify-mcp-p5.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: {
    ...process.env,
    SOGNA_MCP_P5_SKIP_RUNTIME: "1",
    SOGNA_MCP_P5_SKIP_JOB: "1",
  },
});
if (p5.stdout?.trim()) process.stdout.write(p5.stdout);
if (p5.status === 0) ok("verify-mcp-p5 (P5 static)");
else {
  if (p5.stderr?.trim()) process.stderr.write(p5.stderr);
  fail("verify-mcp-p5");
}

const p6 = spawnSync("node", ["scripts/verify-mcp-p6.mjs"], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
  env: { ...process.env, SOGNA_MCP_P6_SKIP_RUNTIME: "1" },
});
if (p6.stdout?.trim()) process.stdout.write(p6.stdout);
if (p6.status === 0) ok("verify-mcp-p6 (P6 static)");
else {
  if (p6.stderr?.trim()) process.stderr.write(p6.stderr);
  fail("verify-mcp-p6");
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s) en MCP CI.`);
  process.exit(1);
}

console.log("MCP CI verify OK.");
