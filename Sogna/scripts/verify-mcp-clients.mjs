#!/usr/bin/env node
/**
 * Comprueba que los clientes MCP tengan UMA y Sognatore registrados
 * y que las URLs Sognatore coincidan con SSOT (puertos + token query si aplica).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { withMcpAuthUrl } from "./lib/mcp-sse-probe.mjs";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoints = loadMcpEndpoints(sognaRoot);
const expectedBridgeSse = withMcpAuthUrl(endpoints.mcp_bridge_sse_url);

const gitRoot =
  sognaRoot.endsWith(`${path.sep}Sogna`) &&
  existsSync(path.join(path.dirname(sognaRoot), "Sogna", "platform.manifest.json"))
    ? path.dirname(sognaRoot)
    : sognaRoot;

const checks = [
  { label: "Cursor", path: path.join(homedir(), ".cursor", "mcp.json") },
  {
    label: "Antigravity (config)",
    path: path.join(homedir(), ".gemini", "config", "mcp_config.json"),
  },
  {
    label: "Antigravity (legacy)",
    path: path.join(homedir(), ".gemini", "antigravity", "mcp_config.json"),
  },
  { label: "Claude Code (user)", path: path.join(homedir(), ".claude.json") },
  { label: "Claude Code (project)", path: path.join(gitRoot, ".mcp.json") },
];

const required = ["UMA", "Sognatore"];
const recommended = ["filesystem", "fetch", "github"];

let failed = 0;

/**
 * @param {unknown} server
 * @returns {string}
 */
function serverUrl(server) {
  const args = server?.args;
  if (!Array.isArray(args) || !args.length) return "";
  return String(args[args.length - 1] ?? "");
}

for (const { label, path: filePath } of checks) {
  if (!existsSync(filePath)) {
    console.log(`[FAIL] ${label}: no existe ${filePath}`);
    failed += 1;
    continue;
  }
  try {
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    const servers = data.mcpServers ?? {};
    const missingRequired = required.filter((name) => !servers[name]);
    const missingRecommended = recommended.filter((name) => !servers[name]);
    if (missingRequired.length) {
      console.log(
        `[FAIL] ${label}: faltan obligatorios ${missingRequired.join(", ")} (pnpm mcp:config)`,
      );
      failed += 1;
      continue;
    }

    const umaUrl = serverUrl(servers.UMA);
    const sogUrl = serverUrl(servers.Sognatore);
    const urlIssues = [];
    if (umaUrl !== endpoints.mcp_uma_sse_url) {
      urlIssues.push(`UMA URL ${umaUrl} ≠ ${endpoints.mcp_uma_sse_url}`);
    }
    if (sogUrl !== expectedBridgeSse && sogUrl !== endpoints.mcp_bridge_sse_url) {
      urlIssues.push(`Sognatore URL ${sogUrl} ≠ SSOT ${expectedBridgeSse}`);
    }
    if (urlIssues.length) {
      console.log(`[WARN] ${label}: ${urlIssues.join("; ")} (pnpm mcp:config)`);
    }

    if (missingRecommended.length) {
      console.log(`[WARN] ${label}: faltan recomendados ${missingRecommended.join(", ")}`);
      console.log(`[OK] ${label}: UMA + Sognatore`);
    } else {
      console.log(`[OK] ${label}: ${[...required, ...recommended].join(", ")}`);
    }
  } catch (err) {
    console.log(`[FAIL] ${label}: JSON invalido (${err instanceof Error ? err.message : err})`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error("\nEjecute: pnpm mcp:config");
  process.exit(1);
}

console.log("\nClientes MCP configurados. Valide runtime con: pnpm mcp:health");
