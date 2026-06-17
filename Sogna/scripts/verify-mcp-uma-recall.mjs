#!/usr/bin/env node
/**
 * Valida semantic_recall en Sogna_UMA vía protocolo FastMCP SSE (paridad mcp-remote / Cursor).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { probeFastMcpToolCall } from "./lib/mcp-sse-probe.mjs";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoints = loadMcpEndpoints(sognaRoot);
const query = process.env.SOGNA_MCP_RECALL_QUERY?.trim() || "estado proyecto Sogna MCP";

const result = await probeFastMcpToolCall({
  name: "Sogna_UMA semantic_recall",
  sseUrl: endpoints.mcp_uma_sse_url,
  toolName: "semantic_recall",
  toolArguments: { query },
});

if (result.ok) {
  console.log(`[OK] ${result.name}`);
  console.log(result.detail);
  process.exit(0);
}

console.error(`[FAIL] ${result.name} — ${result.step}: ${result.detail ?? "fallo"}`);
process.exit(1);
