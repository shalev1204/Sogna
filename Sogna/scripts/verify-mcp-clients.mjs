#!/usr/bin/env node
/**
 * Comprueba que los clientes MCP tengan Sogna_UMA y Sognatore registrados.
 * No sustituye encender la pila local (pnpm sogna:health).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const required = ["Sogna_UMA", "Sognatore"];
const recommended = ["filesystem", "fetch", "github"];

let failed = 0;

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
    } else if (missingRecommended.length) {
      console.log(
        `[WARN] ${label}: faltan recomendados ${missingRecommended.join(", ")}`,
      );
      console.log(`[OK] ${label}: Sogna_UMA + Sognatore`);
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

console.log("\nClientes MCP configurados. Valide runtime con: pnpm sogna:health");
