import { execFile, spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadMcpEndpoints, mcpEndpointsToEnv } from "../scripts/lib/mcp-endpoints.mjs";
import { loadSognaDotenv } from "../scripts/lib/load-dotenv.mjs";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const controlDir = __dirname;
export const projectRoot = path.resolve(controlDir, "..");

const serviceEndpoints = loadMcpEndpoints(projectRoot);
export const ports = serviceEndpoints.all_ports;
export const dashboardUrl = serviceEndpoints.mcp_bridge_dashboard_url;

export const logDir = path.join(projectRoot, "memory", "operational", "logs");
export const diagDir = path.join(logDir, "diagnostics");
export const residentLog = path.join(logDir, "resident.log");
export const mcpUmaLog = path.join(logDir, "mcp_uma.log");
export const sentinelLog = path.join(logDir, "sentinel_watcher.log");
export const bridgeLog = path.join(logDir, "mcp_bridge.log");
export const webLog = path.join(logDir, "web.log");
export const consolidationLog = path.join(logDir, "consolidation_scheduler.log");
export const celeryLog = path.join(logDir, "celery_worker.log");

const isWin = process.platform === "win32";
let bridgeWatchdogFailures = 0;
let bridgeWatchdogTimer = null;
let mcpUmaWatchdogFailures = 0;
let mcpUmaWatchdogTimer = null;

export function resolvePython() {
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

export function assertProject() {
  if (!existsSync(path.join(projectRoot, "Sognatore"))) {
    throw new Error(`Directorio de proyecto no valido: ${projectRoot}`);
  }
}

export function ensureLogDir() {
  mkdirSync(logDir, { recursive: true });
}

export function logLine(file, line) {
  ensureLogDir();
  appendFileSync(file, `[${new Date().toISOString()}] ${line}\n`);
}

async function isPortListening(port) {
  if (isWin) {
    try {
      const { stdout } = await execFileAsync("netstat", ["-ano"], {
        windowsHide: true,
      });
      const lines = stdout.split("\n");
      return lines.some((line) => line.includes(`:${port}`) && line.includes("LISTENING"));
    } catch {
      return false;
    }
  }
  try {
    const { stdout } = await execFileAsync("lsof", [
      `-iTCP:${port}`,
      "-sTCP:LISTENING",
      "-t",
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function anyPortBusy() {
  for (const port of ports) {
    if (await isPortListening(port)) return true;
  }
  return false;
}

async function killPort(port) {
  if (isWin) {
    try {
      const { stdout } = await execFileAsync("netstat", ["-ano"], {
        windowsHide: true,
      });
      const pids = new Set();
      for (const line of stdout.split("\n")) {
        if (!line.includes("LISTENING") || !line.includes(`:${port} `)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          await execFileAsync("taskkill", ["/F", "/PID", pid], {
            windowsHide: true,
          });
        } catch {
          /* best-effort */
        }
      }
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const { stdout } = await execFileAsync("lsof", [`-tiTCP:${port}`]);
    for (const pid of stdout.trim().split("\n").filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Redis / Docker helpers
// ---------------------------------------------------------------------------

const composeFile = path.join(projectRoot, "docker", "docker-compose.yml");

async function redisUp() {
  if (!existsSync(composeFile)) return;
  try {
    await execFileAsync(
      "docker",
      ["compose", "-f", composeFile, "up", "-d", "redis"],
      { cwd: projectRoot, windowsHide: true },
    );
  } catch {
    /* Docker no disponible — continuar sin Redis */
  }
}

async function redisStop() {
  if (!existsSync(composeFile)) return;
  try {
    await execFileAsync(
      "docker",
      ["compose", "-f", composeFile, "stop", "redis"],
      { cwd: projectRoot, windowsHide: true },
    );
  } catch { /* best-effort */ }
}

async function waitForRedis(timeoutMs = 8000) {
  const { createConnection } = await import("node:net");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const s = createConnection({ host: "127.0.0.1", port: 6379 });
      s.setTimeout(1500);
      s.on("connect", () => { s.destroy(); resolve(true); });
      s.on("error", () => resolve(false));
      s.on("timeout", () => { s.destroy(); resolve(false); });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function startCeleryWorker(python) {
  ensureLogDir();
  const pidFile = path.join(projectRoot, "memory", "operational", "agent", "celery_worker.pid");
  mkdirSync(path.dirname(pidFile), { recursive: true });

  const logFd = openSync(celeryLog, "a");
  const celeryBin = isWin
    ? path.join(projectRoot, ".venv", "Scripts", "celery.exe")
    : path.join(projectRoot, ".venv", "bin", "celery");

  const cmd = existsSync(celeryBin) ? celeryBin : python;
  const args = existsSync(celeryBin)
    ? ["-A", "workers.celery_app", "worker", "--loglevel=info", "--concurrency=2", "-n", "sogna_worker@%h"]
    : ["-m", "celery", "-A", "workers.celery_app", "worker", "--loglevel=info", "--concurrency=2", "-n", "sogna_worker@%h"];

  const child = spawn(cmd, args, {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env },
    windowsHide: true,
  });
  child.unref();
  writeFileSync(pidFile, String(child.pid));
  return child.pid;
}

function stopCeleryWorker() {
  const pidFile = path.join(projectRoot, "memory", "operational", "agent", "celery_worker.pid");
  try {
    const pid = parseInt(readFileSync(pidFile, "utf8").trim(), 10);
    if (isWin) {
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch { /* ya detenido */ }
}

// ---------------------------------------------------------------------------

export async function stopServices() {
  console.log("");
  console.log(" SOGNA — Apagado manual");
  console.log(" ======================");
  stopCeleryWorker();
  console.log("[SOGNA] Celery worker detenido");
  for (const port of ports) {
    console.log(`[SOGNA] Puerto ${port}...`);
    await killPort(port);
  }
  await redisStop();
  console.log("[OK] Servicios detenidos.");
}

function spawnBackground(command, args, cwd, logFile, env = process.env) {
  ensureLogDir();
  const envKeys = [
    "SOGNA_MCP_HOST",
    "SOGNA_UMA_API_PORT",
    "SOGNA_MCP_UMA_PORT",
    "SOGNA_MCP_BRIDGE_PORT",
    "SOGNA_WEB_PORT",
  ];
  const envPrefix =
    isWin && envKeys.some((k) => env[k])
      ? `${envKeys
          .filter((k) => env[k])
          .map((k) => `$env:${k}='${String(env[k]).replace(/'/g, "''")}'`)
          .join("; ")}; `
      : "";
  if (isWin) {
    let resolvedCommand = command;
    if (command === "node") {
      resolvedCommand = process.execPath;
    }
    
    const commandLineParts = [resolvedCommand];
    for (const arg of args) {
      if (arg.includes(" ") || arg.includes('"') || arg.includes("\\")) {
        commandLineParts.push(`"${arg.replace(/"/g, '\\"')}"`);
      } else {
        commandLineParts.push(arg);
      }
    }
    const fullCommandLine = commandLineParts.join(" ");
    
    const psCommandLine = fullCommandLine.replace(/'/g, "''");
    const psCwd = cwd.replace(/'/g, "''");
    
    const psCommand = `${envPrefix}Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${psCommandLine}'; CurrentDirectory = '${psCwd}'; ProcessStartupInformation = (New-CimInstance -ClassName Win32_ProcessStartup -Property @{ ShowWindow = [uint16]0 } -ClientOnly) }`;
    
    try {
      const res = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", psCommand], {
        windowsHide: true,
      });
      if (res.status === 0) {
        logLine(logFile, `Proceso lanzado via WMI: ${fullCommandLine} (Cwd: ${cwd})`);
      } else {
        throw new Error(res.stderr ? res.stderr.toString() : `Codigo de salida ${res.status}`);
      }
    } catch (err) {
      logLine(logFile, `Fallo WMI para ${fullCommandLine}. Reintentando con spawn normal. Error: ${err.message}`);
      const useShell = resolvedCommand.toLowerCase().endsWith(".cmd");
      const child = spawn(resolvedCommand, args, {
        cwd,
        detached: true,
        stdio: "ignore",
        shell: useShell,
        windowsHide: true,
        env,
      });
      child.unref();
    }
  } else {
    const child = spawn(command, args, {
      cwd,
      detached: true,
      stdio: "ignore",
      shell: false,
      env,
    });
    child.unref();
  }
}

export async function waitForUmaHealth(maxAttempts = 90) {
  const healthUrl = loadMcpEndpoints(projectRoot).uma_api_health_url;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(healthUrl, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function waitForBridgeHealth(maxAttempts = 30) {
  const healthUrl = loadMcpEndpoints(projectRoot).mcp_bridge_health_url;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Espera a que el proceso UMA MCP (FastMCP) escuche en el puerto SSOT. */
export async function waitForMcpUmaListening(endpoints, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    if (await isPortListening(endpoints.mcp_uma_port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Health del servidor UMA MCP (:8000/health). */
export async function waitForMcpUmaHealth(endpoints, maxAttempts = 30) {
  const healthUrl = endpoints.mcp_uma_health_url;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * Vigila /health del UMA MCP y lo reinicia tras fallos consecutivos.
 * @param {ReturnType<typeof loadMcpEndpoints>} endpoints
 * @param {NodeJS.ProcessEnv} childEnv
 */
export function startMcpUmaWatchdog(endpoints, childEnv) {
  if (mcpUmaWatchdogTimer) return;
  const intervalMs = Math.max(
    30_000,
    parseInt(process.env.SOGNA_MCP_UMA_WATCHDOG_MS || "60000", 10) || 60_000,
  );
  const failThreshold = Math.max(
    2,
    parseInt(process.env.SOGNA_MCP_UMA_WATCHDOG_FAILURES || "3", 10) || 3,
  );
  const python = resolvePython();
  const umaMcpScript = path.join(projectRoot, "memory", "identity", "mcp_uma_server.py");

  mcpUmaWatchdogTimer = setInterval(async () => {
    const ok = await waitForMcpUmaHealth(endpoints, 1);
    if (ok) {
      mcpUmaWatchdogFailures = 0;
      return;
    }
    mcpUmaWatchdogFailures += 1;
    logLine(
      mcpUmaLog,
      `[WATCHDOG] UMA MCP /health fallo (${mcpUmaWatchdogFailures}/${failThreshold})`,
    );
    if (mcpUmaWatchdogFailures < failThreshold) return;
    mcpUmaWatchdogFailures = 0;
    logLine(mcpUmaLog, "[WATCHDOG] Reiniciando UMA MCP...");
    await killPort(endpoints.mcp_uma_port);
    await new Promise((r) => setTimeout(r, 1500));
    spawnBackground(python, [umaMcpScript], projectRoot, mcpUmaLog, childEnv);
  }, intervalMs);
  mcpUmaWatchdogTimer.unref?.();
}

/**
 * Vigila /health del Bridge y lo reinicia tras fallos consecutivos.
 * @param {ReturnType<typeof loadMcpEndpoints>} endpoints
 * @param {NodeJS.ProcessEnv} childEnv
 */
export function startBridgeWatchdog(endpoints, childEnv) {
  if (bridgeWatchdogTimer) return;
  const intervalMs = Math.max(
    30_000,
    parseInt(process.env.SOGNA_BRIDGE_WATCHDOG_MS || "60000", 10) || 60_000,
  );
  const failThreshold = Math.max(
    2,
    parseInt(process.env.SOGNA_BRIDGE_WATCHDOG_FAILURES || "3", 10) || 3,
  );
  const bridgePath = path.join(projectRoot, "engines", "MCP-Bridge", "build", "index.js");

  bridgeWatchdogTimer = setInterval(async () => {
    const ok = await waitForBridgeHealth(1);
    if (ok) {
      bridgeWatchdogFailures = 0;
      return;
    }
    bridgeWatchdogFailures += 1;
    logLine(
      bridgeLog,
      `[WATCHDOG] Bridge /health fallo (${bridgeWatchdogFailures}/${failThreshold})`,
    );
    if (bridgeWatchdogFailures < failThreshold) return;
    bridgeWatchdogFailures = 0;
    logLine(bridgeLog, "[WATCHDOG] Reiniciando MCP Bridge...");
    await killPort(endpoints.mcp_bridge_port);
    await new Promise((r) => setTimeout(r, 1500));
    spawnBackground("node", [bridgePath], projectRoot, bridgeLog, childEnv);
  }, intervalMs);
  bridgeWatchdogTimer.unref?.();
}

export async function startResident() {
  assertProject();
  loadSognaDotenv(projectRoot);
  const python = resolvePython();
  if (!existsSync(python) && python.includes(".venv")) {
    throw new Error(`Python no encontrado: ${python}`);
  }
  ensureLogDir();

  const endpoints = loadMcpEndpoints(projectRoot);
  const childEnv = mcpEndpointsToEnv(endpoints);
  const activePorts = endpoints.all_ports;

  logLine(residentLog, "Arranque residente");

  // [0] Redis via Docker (no bloquea si Docker no está disponible)
  if (existsSync(composeFile)) {
    console.log("[0/6] Redis (Docker)...");
    await redisUp();
    const redisOk = await waitForRedis(8000);
    if (redisOk) {
      console.log("[0/6] Redis OK :6379");
    } else {
      console.log("[WARN] Redis no respondio en 8s — Celery en modo degradado");
    }
  }

  // Apagar preventivamente puertos ocupados para asegurar un estado de inicio limpio y consistente
  for (const port of activePorts) {
    if (await isPortListening(port)) {
      logLine(residentLog, `Puerto ${port} ocupado. Liberando puerto para arranque limpio...`);
      await killPort(port);
    }
  }

  console.log(`[1/6] API UMA ${endpoints.uma_api_port}...`);
  spawnBackground(
    python,
    [path.join(projectRoot, "memory", "identity", "uma_server.py")],
    projectRoot,
    residentLog,
    childEnv,
  );

  const umaReady = await waitForUmaHealth();
  if (!umaReady) {
    console.log(
      `[WARN] API UMA ${endpoints.uma_api_port} no respondio a tiempo; revise ${residentLog}.`,
    );
  }

  console.log(`[2/6] UMA MCP ${endpoints.mcp_uma_port}...`);
  spawnBackground(
    python,
    [path.join(projectRoot, "memory", "identity", "mcp_uma_server.py")],
    projectRoot,
    mcpUmaLog,
    childEnv,
  );

  const mcpUmaReady = await waitForMcpUmaHealth(endpoints);
  if (!mcpUmaReady) {
    const listening = await waitForMcpUmaListening(endpoints, 5);
    if (!listening) {
      console.log(
        `[WARN] UMA MCP ${endpoints.mcp_uma_port} no responde; revise ${mcpUmaLog}`,
      );
    } else {
      console.log(
        `[WARN] UMA MCP escucha pero /health no respondió; revise ${mcpUmaLog}`,
      );
    }
  } else {
    startMcpUmaWatchdog(endpoints, childEnv);
    logLine(
      mcpUmaLog,
      "[WATCHDOG] Activo (intervalo configurable vía SOGNA_MCP_UMA_WATCHDOG_MS)",
    );
  }

  console.log("[3/6] Sentinel Watcher...");
  const watcher = path.join(
    projectRoot,
    "Sognatore",
    "dist",
    "Sognatore",
    "src",
    "scripts",
    "utils",
    "sentinel-watcher.js",
  );
  spawnBackground("node", [watcher], projectRoot, sentinelLog, childEnv);

  console.log(`[4/6] MCP Bridge ${endpoints.mcp_bridge_port} (background)...`);
  const bridge = path.join(projectRoot, "engines", "MCP-Bridge", "build", "index.js");
  spawnBackground("node", [bridge], projectRoot, bridgeLog, childEnv);

  const bridgeReady = await waitForBridgeHealth();
  if (!bridgeReady) {
    console.log(
      `[WARN] MCP Bridge ${endpoints.mcp_bridge_port} /health no respondió a tiempo; revise ${bridgeLog}`,
    );
  } else {
    startBridgeWatchdog(endpoints, childEnv);
    logLine(bridgeLog, "[WATCHDOG] Activo (intervalo configurable vía SOGNA_BRIDGE_WATCHDOG_MS)");
  }

  console.log(`[5/6] Sogna Web App (Vite puerto ${endpoints.web_port})...`);
  if (isWin) {
    const viteJs = path.join(projectRoot, "Curator", "apps", "sogna-web", "node_modules", "vite", "bin", "vite.js");
    const viteCwd = path.join(projectRoot, "Curator", "apps", "sogna-web");
    spawnBackground("node", [viteJs], viteCwd, webLog, childEnv);
  } else {
    const pnpmCmd = "pnpm";
    spawnBackground(pnpmCmd, ["run", "sogna:dev"], projectRoot, webLog, childEnv);
  }

  // [6] Celery worker (solo si Redis está disponible)
  const redisAvailable = await waitForRedis(2000);
  if (redisAvailable) {
    console.log("[6/6] Celery worker...");
    const celeryPid = startCeleryWorker(python);
    console.log(`[6/6] Celery PID ${celeryPid}  log=${celeryLog}`);
  } else {
    console.log("[6/6] Celery omitido — Redis no disponible (pnpm redis:up para activar)");
  }

  return 0;
}

export async function runCheck() {
  assertProject();
  mkdirSync(diagDir, { recursive: true });
  const diagLog = path.join(diagDir, "check_latest.txt");
  const diagnose = path.join(projectRoot, "Sognatore", "dist", "Sognatore", "diagnose.js");
  console.log("");
  console.log(" SOGNA CHECK");
  console.log(" ===========");
  try {
    const { stdout, stderr } = await execFileAsync("node", [diagnose], {
      cwd: projectRoot,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });
    const out = stdout + (stderr ? `\n${stderr}` : "");
    writeFileSync(diagLog, out, "utf8");
    process.stdout.write(out);
    return 0;
  } catch (err) {
    const out =
      (err && typeof err === "object" && "stdout" in err ? String(err.stdout) : "") +
      (err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "") +
      (err instanceof Error ? `\n${err.message}` : "");
    writeFileSync(diagLog, out, "utf8");
    process.stdout.write(out);
    return typeof err === "object" && err && "code" in err ? Number(err.code) || 1 : 1;
  }
}

export async function runSync() {
  assertProject();
  const python = resolvePython();
  console.log("");
  console.log(" SOGNA SYNC");
  console.log(" =========");
  const signer = path.join(
    projectRoot,
    "Sognatore",
    "dist",
    "Sognatore",
    "src",
    "scripts",
    "utils",
    "SentinelSigner.js",
  );
  await execFileAsync("node", [signer], { cwd: projectRoot, windowsHide: true });
  await execFileAsync(
    python,
    [path.join(projectRoot, "memory", "identity", "consolidate.py")],
    { cwd: projectRoot, windowsHide: true },
  );
  return 0;
}

export async function runHologram() {
  assertProject();
  const hologram = path.join(
    projectRoot,
    "Sognatore",
    "dist",
    "Sognatore",
    "src",
    "core",
    "viz",
    "session-hologram.js",
  );
  await execFileAsync("node", [hologram], { cwd: projectRoot, windowsHide: true });
  return 0;
}

export async function openDashboard() {
  console.log(`[SOGNA] ${dashboardUrl}`);
  if (isWin) {
    await execFileAsync("cmd", ["/c", "start", "", dashboardUrl], {
      windowsHide: true,
    });
  } else {
    await execFileAsync("open", [dashboardUrl]);
  }
  return 0;
}

export async function runConsolidationScheduled() {
  assertProject();
  loadSognaDotenv(projectRoot);
  ensureLogDir();
  const python = resolvePython();
  const stamp = new Date().toISOString();
  appendFileSync(consolidationLog, `\n==================================================\n`);
  appendFileSync(consolidationLog, `[${stamp}] SOGNA consolidation pipeline start\n`);
  appendFileSync(consolidationLog, `==================================================\n`);
  try {
    const { stdout, stderr } = await execFileAsync(
      python,
      [path.join(projectRoot, "memory", "identity", "consolidate.py")],
      { cwd: projectRoot, windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
    );
    if (stdout) appendFileSync(consolidationLog, stdout);
    if (stderr) appendFileSync(consolidationLog, stderr);
    appendFileSync(consolidationLog, `[${new Date().toISOString()}] OK — pipeline complete\n`);
    return 0;
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? Number(err.code) || 1 : 1;
    appendFileSync(
      consolidationLog,
      `[${new Date().toISOString()}] ERROR — exit code ${code}\n`,
    );
    if (err && typeof err === "object" && "stdout" in err && err.stdout) {
      appendFileSync(consolidationLog, String(err.stdout));
    }
    if (err && typeof err === "object" && "stderr" in err && err.stderr) {
      appendFileSync(consolidationLog, String(err.stderr));
    }
    return code;
  }
}

export async function runMcpHealth() {
  const healthScript = path.join(projectRoot, "scripts", "verify-mcp-health.mjs");
  return new Promise((resolve) => {
    const child = spawn("node", [healthScript], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

export async function runUpForeground() {
  const code = await startResident();
  if (code !== 0) return code;
  const endpoints = loadMcpEndpoints(projectRoot);
  console.log(`[4/4] MCP Bridge (${endpoints.mcp_bridge_port}) — Ctrl+C para detener`);
  console.log(` Dashboard: ${endpoints.mcp_bridge_dashboard_url}`);
  const bridge = path.join(projectRoot, "engines", "MCP-Bridge", "build", "index.js");
  const childEnv = mcpEndpointsToEnv(loadMcpEndpoints(projectRoot));
  return new Promise((resolve) => {
    const child = spawn("node", [bridge], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
      env: childEnv,
    });
    child.on("exit", (c) => resolve(c ?? 0));
  });
}
