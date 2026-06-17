#!/usr/bin/env node
/**
 * Verificación P3 — observabilidad MCP (estático + runtime opcional).
 * SOGNA_MCP_OBS_SKIP_RUNTIME=1 — solo comprobaciones de código/artefacto.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { loadMcpContract } from "./lib/mcp-contract.mjs";
import { probeHttpReachable } from "./lib/mcp-sse-probe.mjs";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoints = loadMcpEndpoints(sognaRoot);
const contract = loadMcpContract(sognaRoot);

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

console.log("=== MCP observability verify (P3) ===\n");

const obsSrc = path.join(sognaRoot, "engines", "MCP-Bridge", "src", "mcpObservability.ts");
if (existsSync(obsSrc)) {
  ok("mcpObservability.ts presente");
} else {
  fail("mcpObservability.ts ausente");
}

const bridgeIndex = path.join(sognaRoot, "engines", "MCP-Bridge", "src", "index.ts");
if (existsSync(bridgeIndex)) {
  const src = readFileSync(bridgeIndex, "utf8");
  for (const route of ["/metrics", "/mcp-stack"]) {
    if (src.includes(`app.get("${route}"`)) ok(`Bridge ruta ${route}`);
    else fail(`Bridge sin ruta ${route}`);
  }
} else {
  fail("MCP-Bridge src/index.ts ausente");
}

const sogna = contract.servers?.Sognatore;
if (sogna?.metrics_path === "/metrics" && sogna?.mcp_stack_path === "/mcp-stack") {
  ok("mcp.contract.json paths /metrics + /mcp-stack");
} else {
  fail("mcp.contract.json sin metrics_path o mcp_stack_path");
}

const dashboard = path.join(sognaRoot, "control", "dashboard", "index.html");
if (existsSync(dashboard) && readFileSync(dashboard, "utf8").includes("/mcp-stack")) {
  ok("dashboard consume /mcp-stack");
} else {
  fail("dashboard sin panel MCP stack");
}

const umaPy = path.join(sognaRoot, "memory", "identity", "mcp_uma_server.py");
if (
  existsSync(umaPy) &&
  readFileSync(umaPy, "utf8").includes("SOGNA_MCP_ALLOW_WRITE")
) {
  ok("UMA run_consolidation_pipeline exige SOGNA_MCP_ALLOW_WRITE");
} else {
  fail("UMA sin guard L3 en run_consolidation_pipeline");
}

const autoCfg = path.join(sognaRoot, "Curator", "scripts", "auto_config_mcp.py");
if (existsSync(autoCfg) && readFileSync(autoCfg, "utf8").includes("use_portable_mcp_entries")) {
  ok("auto_config_mcp.py modo portable/CI");
} else {
  fail("auto_config_mcp.py sin modo portable");
}

if (process.env.SOGNA_MCP_OBS_SKIP_RUNTIME !== "1") {
  const [metrics, stack] = await Promise.all([
    probeHttpReachable({ name: "Bridge /metrics", url: endpoints.mcp_bridge_metrics_url }),
    probeHttpReachable({ name: "Bridge /mcp-stack", url: endpoints.mcp_bridge_stack_url }),
  ]);
  if (metrics.ok) ok(`Bridge /metrics HTTP ${metrics.status}`);
  else fail(`Bridge /metrics — ${metrics.error ?? "caído"} (pnpm sogna:on)`);
  if (stack.ok) ok(`Bridge /mcp-stack HTTP ${stack.status}`);
  else fail(`Bridge /mcp-stack — ${stack.error ?? "caído"}`);
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s) en MCP observability.`);
  process.exit(1);
}

console.log("MCP observability P3 OK.");
