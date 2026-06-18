#!/usr/bin/env node
/**
 * Verificación P6 — watchdog UMA MCP + transporte dual SSE/Streamable HTTP.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { loadMcpContract } from "./lib/mcp-contract.mjs";
import {
  probeHttpReachable,
  probeMcpSseInitialize,
  probeStreamableInitialize,
} from "./lib/mcp-sse-probe.mjs";

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

console.log("=== MCP P6 verify (UMA watchdog + streamable) ===\n");

const umaPy = path.join(sognaRoot, "memory", "identity", "mcp_uma_server.py");
const runtimeJs = path.join(sognaRoot, "control", "runtime.mjs");

if (!existsSync(umaPy)) {
  fail("mcp_uma_server.py ausente");
} else {
  const src = readFileSync(umaPy, "utf8");
  if (src.includes('streamable_http_path = "/sse"') && src.includes("run_dual_async")) {
    ok("UMA MCP transporte dual (SSE + Streamable en /sse)");
  } else {
    fail("UMA MCP sin transporte dual P6");
  }
  if (src.includes('Route("/health"') && src.includes('Route("/ready"')) {
    ok("UMA MCP /health y /ready");
  } else {
    fail("UMA MCP sin endpoints /health /ready");
  }
}

if (!existsSync(runtimeJs)) {
  fail("control/runtime.mjs ausente");
} else {
  const rt = readFileSync(runtimeJs, "utf8");
  if (rt.includes("startMcpUmaWatchdog") && rt.includes("waitForMcpUmaHealth")) {
    ok("runtime startMcpUmaWatchdog + waitForMcpUmaHealth");
  } else {
    fail("runtime sin watchdog UMA MCP");
  }
}

if (contract) {
  const uma = /** @type {{ transport?: unknown; health_path?: string; streamable_http_path?: string }} */ (
    contract.servers?.UMA || {}
  );
  const transports = Array.isArray(uma.transport) ? uma.transport : [uma.transport];
  if (transports.includes("sse") && transports.includes("streamable-http")) {
    ok("contrato UMA transport dual");
  } else {
    fail("contrato UMA sin transport dual");
  }
  if (uma.health_path === "/health" && uma.streamable_http_path === "/sse") {
    ok("contrato paths /health + streamable /sse");
  } else {
    fail("contrato UMA paths P6 incompletos");
  }
} else {
  fail("mcp.contract.json ausente");
}

if (endpoints.mcp_uma_health_url && endpoints.mcp_uma_ready_url) {
  ok("mcp-endpoints URLs UMA health/ready");
} else {
  fail("mcp-endpoints sin mcp_uma_health_url");
}

if (process.env.SOGNA_MCP_P6_SKIP_RUNTIME === "1") {
  ok("runtime omitido (SOGNA_MCP_P6_SKIP_RUNTIME=1)");
} else {
  const [health, ready] = await Promise.all([
    probeHttpReachable({ name: "UMA MCP health", url: endpoints.mcp_uma_health_url }),
    probeHttpReachable({ name: "UMA MCP ready", url: endpoints.mcp_uma_ready_url }),
  ]);
  if (health.ok) ok(`UMA MCP /health HTTP ${health.status}`);
  else fail(`UMA MCP /health — ${health.error ?? "caído"}`);
  if (ready.ok) ok(`UMA MCP /ready HTTP ${ready.status}`);
  else fail(`UMA MCP /ready — ${ready.error ?? "no listo"}`);

  const sse = await probeMcpSseInitialize({
    name: "UMA SSE",
    sseUrl: endpoints.mcp_uma_sse_url,
    transport: "fastmcp",
  });
  if (sse.ok) ok(`UMA SSE initialize HTTP ${sse.status}`);
  else fail(`UMA SSE — ${sse.step}: ${sse.detail ?? "fallo"}`);

  const stream = await probeStreamableInitialize({
    name: "UMA Streamable",
    sseUrl: endpoints.mcp_uma_sse_url,
  });
  if (stream.ok) ok(`UMA Streamable POST ${stream.status} (${stream.detail})`);
  else fail(`UMA Streamable — ${stream.detail ?? "fallo"}`);
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s) en MCP P6.`);
  process.exit(1);
}

console.log("MCP P6 OK.");
