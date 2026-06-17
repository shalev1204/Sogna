#!/usr/bin/env node
/**
 * Comprueba que la pila MCP local de Sogna este escuchando y acepte initialize.
 * Uso: node scripts/verify-mcp-health.mjs (desde sogna_root)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { probeHttpReachable, probeMcpSseInitialize, probeStreamableInitialize } from "./lib/mcp-sse-probe.mjs";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoints = loadMcpEndpoints(sognaRoot);

let failed = 0;

const umaApi = await probeHttpReachable({
  name: "UMA API",
  url: endpoints.uma_api_health_url,
});
{
  const tag = umaApi.ok ? "OK" : "FAIL";
  const detail = umaApi.ok ? `HTTP ${umaApi.status}` : umaApi.error ?? "sin respuesta";
  console.log(`[${tag}] ${umaApi.name} — ${umaApi.url} (${detail})`);
  if (!umaApi.ok) failed += 1;
}

const bridgeHealth = await probeHttpReachable({
  name: "Bridge /health",
  url: endpoints.mcp_bridge_health_url,
});
{
  const tag = bridgeHealth.ok ? "OK" : "FAIL";
  const detail = bridgeHealth.ok ? `HTTP ${bridgeHealth.status}` : bridgeHealth.error ?? "sin respuesta";
  console.log(`[${tag}] ${bridgeHealth.name} — ${endpoints.mcp_bridge_health_url} (${detail})`);
  if (!bridgeHealth.ok) failed += 1;
}

const bridgeReady = await probeHttpReachable({
  name: "Bridge /ready",
  url: endpoints.mcp_bridge_ready_url,
});
{
  const tag = bridgeReady.ok ? "OK" : "FAIL";
  const detail = bridgeReady.ok ? `HTTP ${bridgeReady.status}` : bridgeReady.error ?? "sin respuesta";
  console.log(`[${tag}] ${bridgeReady.name} — ${endpoints.mcp_bridge_ready_url} (${detail})`);
  if (!bridgeReady.ok) failed += 1;
}

const mcpProbes = await Promise.all([
  probeMcpSseInitialize({
    name: "MCP Sogna_UMA (SSE)",
    sseUrl: endpoints.mcp_uma_sse_url,
    transport: "fastmcp",
  }),
  probeMcpSseInitialize({
    name: "MCP Sognatore Bridge (SSE)",
    sseUrl: endpoints.mcp_bridge_sse_url,
    transport: "sognatore",
  }),
]);

for (const r of mcpProbes) {
  const tag = r.ok ? "OK" : "FAIL";
  const detail = r.ok
    ? `initialize HTTP ${r.status} (${r.transport})`
    : `${r.step}: ${r.detail ?? "sin respuesta"}`;
  const url =
    r.name.includes("UMA") ? endpoints.mcp_uma_sse_url : endpoints.mcp_bridge_sse_url;
  console.log(`[${tag}] ${r.name} — ${url} (${detail})`);
  if (!r.ok) failed += 1;
}

const streamable = await probeStreamableInitialize({
  name: "MCP Sognatore (Streamable HTTP)",
  sseUrl: endpoints.mcp_bridge_sse_url,
});
{
  const tag = streamable.ok ? "OK" : "FAIL";
  const detail = streamable.ok
    ? `POST ${streamable.status} (${streamable.detail})`
    : `${streamable.step}: ${streamable.detail ?? "fallo"}`;
  console.log(`[${tag}] ${streamable.name} — ${endpoints.mcp_bridge_sse_url} (${detail})`);
  if (!streamable.ok) failed += 1;
}

if (failed > 0) {
  console.error(
    "\nServicios MCP locales caidos o handshake fallido. Encienda: pnpm sogna:on",
  );
  console.error("Diagnostico completo: pnpm mcp:doctor");
  process.exitCode = 1;
} else {
  console.log("\nPila MCP local operativa (SSE + initialize). Reinicie MCP en Cursor si los clientes siguen en error.");
  process.exitCode = 0;
}
