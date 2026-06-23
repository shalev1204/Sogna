#!/usr/bin/env node
/**
 * SOGNA GIT SYNC — Sincronización destructiva con la versión de GitHub (origin).
 * Hace un fetch, un reset --hard de la rama actual al remote origin/<rama>,
 * un clean -fd de archivos no tracked, y finaliza ejecutando sogna-dream.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");

function resolveGitRoot(sRoot) {
  const embedded =
    sRoot.endsWith(`${path.sep}Sogna`) &&
    spawnSync("git", ["rev-parse", "--git-dir"], {
      cwd: path.dirname(sRoot),
      encoding: "utf8",
      windowsHide: true,
    }).status === 0;

  if (embedded) return path.dirname(sRoot);
  return sRoot;
}

const gitRoot = resolveGitRoot(sognaRoot);

function run(cmd, args, cwd = gitRoot) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: process.env,
  });
  if (r.stdout?.trim()) console.log(r.stdout.trim());
  if (r.stderr?.trim()) console.error(r.stderr.trim());
  return r;
}

console.log("=== Sogna Git Sync ===");

// 1. Git fetch origin
const fetchResult = run("git", ["fetch", "origin"]);
if (fetchResult.status !== 0) {
  console.error("Error al hacer git fetch origin.");
  process.exit(1);
}

// 2. Obtener rama actual
const branchResult = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
  cwd: gitRoot,
  encoding: "utf8",
  windowsHide: true,
});
if (branchResult.status !== 0) {
  console.error("Error al obtener la rama actual.");
  process.exit(1);
}
const branch = branchResult.stdout.trim();
console.log(`Rama detectada: ${branch}`);

// 3. Git reset --hard origin/${branch}
const resetResult = run("git", ["reset", "--hard", `origin/${branch}`]);
if (resetResult.status !== 0) {
  console.error(`Error al hacer reset a origin/${branch}.`);
  process.exit(1);
}

// Proteger este script de git clean agregándolo al índice git (staged)
const currentScriptRelPath = path.relative(gitRoot, fileURLToPath(import.meta.url));
run("git", ["add", currentScriptRelPath]);

// 4. Git clean -fd (limpiará archivos no trackeados, protegiendo este script ya que está en stage)
const cleanResult = run("git", ["clean", "-fd"]);
if (cleanResult.status !== 0) {
  console.error("Error al ejecutar git clean.");
  process.exit(1);
}

console.log("\nSincronización Git completada con éxito. Ejecutando Sogna Dream...");

// 5. Ejecutar Sogna Dream para verificar/reconstruir el entorno
const dreamResult = spawnSync("node", [path.join(sognaRoot, "scripts", "sogna-dream.mjs")], {
  cwd: sognaRoot,
  stdio: "inherit",
  windowsHide: true,
});

process.exit(dreamResult.status ?? 0);
