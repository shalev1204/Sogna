#!/usr/bin/env node
/**
 * Carga y validación del contrato MCP (mcp.contract.json).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * @param {string} sognaRoot
 * @returns {Record<string, unknown> | null}
 */
export function loadMcpContract(sognaRoot) {
  const contractPath = path.join(sognaRoot, "mcp.contract.json");
  if (!existsSync(contractPath)) return null;
  try {
    return JSON.parse(readFileSync(contractPath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} contract
 * @param {string} serverKey
 * @returns {Array<{ name: string; tier?: string }>}
 */
export function listContractTools(contract, serverKey) {
  const servers = /** @type {Record<string, { tools?: { name: string; tier?: string }[] }>} */ (
    contract.servers || {}
  );
  const server = servers[serverKey];
  if (!server?.tools) return [];
  return server.tools.filter((t) => t?.name);
}

/**
 * @param {Record<string, unknown>} contract
 * @param {string} serverKey
 * @returns {Map<string, string>}
 */
export function contractToolTiers(contract, serverKey) {
  const map = new Map();
  for (const tool of listContractTools(contract, serverKey)) {
    if (tool.tier) map.set(tool.name, tool.tier);
  }
  return map;
}

/**
 * @param {Record<string, unknown>} contract
 * @param {string} serverKey
 * @returns {string[]}
 */
export function listContractToolNames(contract, serverKey) {
  return listContractTools(contract, serverKey).map((t) => t.name);
}

/**
 * @param {string} sognaRoot
 * @param {string} fileRel
 * @param {string[]} toolNames
 * @returns {{ missing: string[]; ok: boolean }}
 */
export function verifyToolsInSource(sognaRoot, fileRel, toolNames) {
  const filePath = path.join(sognaRoot, fileRel);
  if (!existsSync(filePath)) {
    return { missing: toolNames, ok: false };
  }
  const src = readFileSync(filePath, "utf8");
  const missing = toolNames.filter((name) => {
    if (src.includes(`name: "${name}"`)) return false;
    if (src.includes(`"${name}"`)) return false;
    if (src.includes(`def ${name}(`)) return false;
    if (src.includes(`@mcp.tool()`)) {
      // Python: buscar def name en archivo tras decorador
      const re = new RegExp(`def\\s+${name}\\s*\\(`, "m");
      if (re.test(src)) return false;
    }
    return true;
  });
  return { missing, ok: missing.length === 0 };
}
