#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

function resolvePython() {
  const candidates = isWin
    ? [path.join(projectRoot, ".venv", "Scripts", "python.exe")]
    : [
        path.join(projectRoot, ".venv", "bin", "python3"),
        path.join(projectRoot, ".venv", "bin", "python"),
      ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return isWin ? "python" : "python3";
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Error: Se requiere especificar el script de Python a ejecutar.");
  process.exit(1);
}

const pythonBin = resolvePython();
const result = spawnSync(pythonBin, args, {
  cwd: projectRoot,
  stdio: "inherit",
  windowsHide: true,
});

process.exit(result.status ?? 0);
