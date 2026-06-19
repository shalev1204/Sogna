#!/usr/bin/env node
/**
 * worker-celery.mjs — arrancar / parar el Celery worker de Sogna.
 * Uso: node scripts/worker-celery.mjs [start|stop|status]
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

try {
  const { loadSognaDotenv } = await import("./lib/load-dotenv.mjs");
  loadSognaDotenv(projectRoot);
} catch { /* sin .env */ }

const { resolvePythonExecutable } = await import("./lib/toolchain-bootstrap.mjs");

const pidFile = path.join(projectRoot, "memory", "operational", "agent", "celery_worker.pid");
const logFile = path.join(projectRoot, "memory", "operational", "logs", "celery_worker.log");

function ensureDirs() {
  mkdirSync(path.dirname(pidFile), { recursive: true });
  mkdirSync(path.dirname(logFile), { recursive: true });
}

function readPid() {
  try {
    return parseInt(readFileSync(pidFile, "utf8").trim(), 10);
  } catch {
    return null;
  }
}

function isAlive(pid) {
  if (!pid) return false;
  try {
    const r = spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/NH"], { encoding: "utf8" });
    return r.stdout.includes(String(pid));
  } catch {
    return false;
  }
}

async function startWorker() {
  ensureDirs();
  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.log(`[worker-celery] Ya en ejecucion PID ${existing}`);
    return;
  }

  const python = resolvePythonExecutable(projectRoot);
  if (!existsSync(python)) {
    console.error(`[worker-celery] Python no encontrado: ${python}`);
    process.exit(1);
  }

  const logFd = await (async () => {
    const { openSync } = await import("node:fs");
    return openSync(logFile, "a");
  })();

  const child = spawn(
    python,
    ["-m", "celery", "-A", "workers.celery_app", "worker",
     "--loglevel=info", "--concurrency=2",
     "-n", "sogna_worker@%h"],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env },
    },
  );
  child.unref();

  writeFileSync(pidFile, String(child.pid));
  console.log(`[worker-celery] Iniciado PID ${child.pid}  log=${logFile}`);
}

function stopWorker() {
  const pid = readPid();
  if (!pid) { console.log("[worker-celery] No hay PID registrado"); return; }
  if (!isAlive(pid)) { console.log(`[worker-celery] PID ${pid} ya no existe`); return; }

  spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
  console.log(`[worker-celery] Detenido PID ${pid}`);
  try { require("node:fs").unlinkSync(pidFile); } catch { /* ok */ }
}

function statusWorker() {
  const pid = readPid();
  const alive = isAlive(pid);
  console.log(`[worker-celery] PID=${pid ?? "—"}  alive=${alive}`);
}

const cmd = process.argv[2] || "start";
if (cmd === "start") await startWorker();
else if (cmd === "stop") stopWorker();
else if (cmd === "status") statusWorker();
else { console.error(`[worker-celery] Comando desconocido: ${cmd}`); process.exit(1); }
