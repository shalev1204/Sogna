#!/usr/bin/env node
/**
 * Verifica paridad mcp.contract.json ↔ código fuente, tiers, política y puertos SSOT.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import {
  loadMcpContract,
  listContractToolNames,
  contractToolTiers,
} from "./lib/mcp-contract.mjs";

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

/**
 * @param {string} sognaRoot
 * @param {string[]} relPaths
 * @param {string[]} toolNames
 */
function findMissingTools(sognaRoot, relPaths, toolNames) {
  let src = "";
  for (const rel of relPaths) {
    const p = path.join(sognaRoot, rel);
    if (existsSync(p)) src += readFileSync(p, "utf8") + "\n";
  }
  return toolNames.filter((name) => {
    if (src.includes(`name: "${name}"`)) return false;
    if (src.includes(`def ${name}(`)) return false;
    return true;
  });
}

/**
 * @param {string} src
 * @param {string} tier
 * @param {string[]} toolNames
 */
function toolsInTierBlock(src, tier, toolNames) {
  const blockRe = new RegExp(`${tier}:\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`, "m");
  const match = src.match(blockRe);
  if (!match) return toolNames;
  const block = match[1];
  return toolNames.filter((name) => !block.includes(`"${name}"`));
}

if (!contract) {
  fail("mcp.contract.json no encontrado o inválido");
  process.exit(1);
}

ok(`mcp.contract.json schema ${contract.schema_version || "?"}`);

const umaTools = listContractToolNames(contract, "UMA");
const umaMissing = findMissingTools(sognaRoot, ["memory/identity/mcp_uma_server.py"], umaTools);
if (umaMissing.length === 0) {
  ok(`UMA tools (${umaTools.length}) en mcp_uma_server.py`);
} else {
  fail(`UMA faltan: ${umaMissing.join(", ")}`);
}

const sogTools = listContractToolNames(contract, "Sognatore");
const sogMissing = findMissingTools(
  sognaRoot,
  ["engines/MCP-Bridge/src/index.ts", "engines/MCP-Bridge/src/sognatoreMcp.ts"],
  sogTools,
);
if (sogMissing.length === 0) {
  ok(`Sognatore tools (${sogTools.length}) en MCP-Bridge`);
} else {
  fail(`Sognatore faltan: ${sogMissing.join(", ")}`);
}

const policyPath = path.join(sognaRoot, "engines", "MCP-Bridge", "src", "mcpToolPolicy.ts");
if (existsSync(policyPath)) {
  const policySrc = readFileSync(policyPath, "utf8");
  const sogTiers = contractToolTiers(contract, "Sognatore");
  let tierOk = true;
  for (const [tier, names] of [
    ["L0", []],
    ["L1", []],
    ["L2", []],
    ["L3", []],
  ]) {
    const tierNames = [...sogTiers.entries()]
      .filter(([, t]) => t === tier)
      .map(([n]) => n);
    const missingInCode = toolsInTierBlock(policySrc, tier, tierNames);
    if (missingInCode.length) {
      fail(`Sognatore tier ${tier} en contract pero no en mcpToolPolicy: ${missingInCode.join(", ")}`);
      tierOk = false;
    }
  }
  if (tierOk) ok("Sognatore tiers alineados (contract ↔ mcpToolPolicy)");
} else {
  fail("mcpToolPolicy.ts ausente");
}

const timeouts = /** @type {Record<string, number>} */ (contract.tool_timeouts_ms || {});
for (const tier of ["L0", "L1", "L2", "L3"]) {
  if (typeof timeouts[tier] === "number" && timeouts[tier] > 0) continue;
  fail(`tool_timeouts_ms.${tier} inválido en contrato`);
}
if (Object.keys(timeouts).length === 4) {
  ok("tool_timeouts_ms definidos en contrato");
}

const servers = /** @type {Record<string, { default_port?: number }>} */ (contract.servers || {});
if (
  servers.UMA?.default_port === endpoints.mcp_uma_port &&
  servers.Sognatore?.default_port === endpoints.mcp_bridge_port
) {
  ok(`Puertos SSOT (UMA ${endpoints.mcp_uma_port}, Bridge ${endpoints.mcp_bridge_port})`);
} else {
  fail("Puertos contract ≠ loadMcpEndpoints()");
}

const legacyMcpNames = [
  ["Sogna", "_", "UMA"].join(""),
  ["Sogna", " UMA"].join(""),
  ["MCP", " UMA"].join(""),
];
const scanSkip = new Set([
  "node_modules",
  ".git",
  "memory/operational",
  "memory/intelligence/episodic",
  "engines/MCP-Bridge/build",
]);
const scanExt = new Set([".json", ".py", ".ts", ".mjs", ".md", ".mdc", ".html", ".ps1"]);

/**
 * @param {string} dir
 * @param {string[]} hits
 */
function scanLegacyMcpNames(dir, hits) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = path.relative(sognaRoot, path.join(dir, entry.name)).replace(/\\/g, "/");
    if (scanSkip.has(rel) || [...scanSkip].some((s) => rel.startsWith(`${s}/`))) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanLegacyMcpNames(full, hits);
      continue;
    }
    if (!scanExt.has(path.extname(entry.name))) continue;
    const src = readFileSync(full, "utf8");
    for (const legacy of legacyMcpNames) {
      if (src.includes(legacy)) hits.push(`${rel}: "${legacy}"`);
    }
  }
}

const legacyHits = [];
scanLegacyMcpNames(sognaRoot, legacyHits);
if (legacyHits.length === 0) {
  ok("sin nombres MCP legacy en fuente activa");
} else {
  for (const hit of legacyHits.slice(0, 8)) fail(`nombre MCP legacy — ${hit}`);
  if (legacyHits.length > 8) fail(`… y ${legacyHits.length - 8} más`);
}

if (failed > 0) {
  console.error(`\n${failed} comprobación(es) fallida(s).`);
  process.exit(1);
}

console.log("\nMCP contract OK.");
