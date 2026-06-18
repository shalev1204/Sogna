#!/usr/bin/env node
/**
 * Verificación P4 — handshake MCP + tools/list (contrato runtime).
 * SOGNA_MCP_HANDSHAKE_SKIP_RUNTIME=1 — solo comprobaciones estáticas.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { loadMcpContract, listContractToolNames } from "./lib/mcp-contract.mjs";
import {
  probeMcpSseInitialize,
  probeStreamableInitialize,
  probeStreamableToolsList,
  withMcpAuthUrl,
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

console.log("=== MCP handshake verify (P4) ===\n");

if (!contract) {
  fail("mcp.contract.json ausente");
  process.exit(1);
}

const policy = /** @type {Record<string, string>} */ (contract.policy || {});
if (policy.mcp_token_env === "SOGNA_MCP_TOKEN") {
  ok("contrato policy.mcp_token_env");
} else {
  fail("contrato sin policy.mcp_token_env");
}

const bridgeAuth = path.join(sognaRoot, "engines", "MCP-Bridge", "src", "mcpLocalAuth.ts");
if (existsSync(bridgeAuth)) {
  ok("mcpLocalAuth.ts presente");
} else {
  fail("mcpLocalAuth.ts ausente");
}

const toolPolicy = path.join(sognaRoot, "engines", "MCP-Bridge", "src", "mcpToolPolicy.ts");
if (existsSync(toolPolicy) && readFileSync(toolPolicy, "utf8").includes("getToolTimeoutMs")) {
  ok("timeouts por tier (getToolTimeoutMs)");
} else {
  fail("mcpToolPolicy sin getToolTimeoutMs");
}

const autoCfg = path.join(sognaRoot, "Curator", "scripts", "auto_config_mcp.py");
if (existsSync(autoCfg) && readFileSync(autoCfg, "utf8").includes("append_mcp_token")) {
  ok("auto_config token en URL Bridge");
} else {
  fail("auto_config sin append_mcp_token");
}

if (process.env.SOGNA_MCP_HANDSHAKE_SKIP_RUNTIME === "1") {
  ok("runtime omitido (SOGNA_MCP_HANDSHAKE_SKIP_RUNTIME=1)");
} else {
  const token = process.env.SOGNA_MCP_TOKEN?.trim();
  if (token) {
    const bareUrl = endpoints.mcp_bridge_sse_url;
    const denied = await fetch(bareUrl, { method: "GET", signal: AbortSignal.timeout(4000) }).catch(
      () => null,
    );
    if (denied?.status === 401) {
      ok("Bridge rechaza GET /sse sin token (401)");
    } else {
      fail(`Bridge sin 401 sin token (status ${denied?.status ?? "error"})`);
    }
  } else {
    ok("SOGNA_MCP_TOKEN no configurado — auth MCP opcional");
  }

  const uma = await probeMcpSseInitialize({
    name: "UMA handshake",
    sseUrl: endpoints.mcp_uma_sse_url,
    transport: "fastmcp",
  });
  if (uma.ok) ok(`UMA initialize HTTP ${uma.status}`);
  else fail(`UMA — ${uma.step}: ${uma.detail ?? "fallo"}`);

  const umaStreamable = await probeStreamableInitialize({
    name: "UMA streamable",
    sseUrl: endpoints.mcp_uma_sse_url,
  });
  if (umaStreamable.ok) ok(`UMA streamable POST ${umaStreamable.status}`);
  else fail(`UMA streamable — ${umaStreamable.detail ?? "fallo"}`);

  const streamable = await probeStreamableInitialize({
    name: "Sognatore streamable",
    sseUrl: endpoints.mcp_bridge_sse_url,
  });
  if (streamable.ok) ok(`Sognatore streamable POST ${streamable.status}`);
  else fail(`Sognatore streamable — ${streamable.detail ?? "fallo"}`);

  const sogTools = listContractToolNames(contract, "Sognatore");
  const toolsList = await probeStreamableToolsList({
    name: "Sognatore tools/list",
    sseUrl: endpoints.mcp_bridge_sse_url,
    expectedTools: sogTools,
  });
  if (toolsList.ok) ok(`Sognatore tools/list — ${toolsList.detail}`);
  else fail(`Sognatore tools/list — ${toolsList.detail ?? "fallo"}`);

  const sse = await probeMcpSseInitialize({
    name: "Sognatore SSE legacy",
    sseUrl: endpoints.mcp_bridge_sse_url,
    transport: "sognatore",
  });
  if (sse.ok) ok(`Sognatore SSE initialize HTTP ${sse.status}`);
  else fail(`Sognatore SSE — ${sse.step}: ${sse.detail ?? "fallo"}`);

  if (token) {
    const authed = withMcpAuthUrl(endpoints.mcp_bridge_sse_url);
    if (authed.includes("token=")) ok("withMcpAuthUrl añade token");
    else fail("withMcpAuthUrl no añade token");
  }
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s) en MCP handshake P4.`);
  process.exit(1);
}

console.log("MCP handshake P4 OK.");
