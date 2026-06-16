import { execFile, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const controlDir = __dirname;
export const projectRoot = path.resolve(controlDir, "..");

export const ports = [8080, 8000, 8001, 5173];
export const dashboardUrl = "http://127.0.0.1:8001/dashboard/";

export const logDir = path.join(projectRoot, "memory", "operational", "logs");
export const diagDir = path.join(logDir, "diagnostics");
export const residentLog = path.join(logDir, "resident.log");
export const mcpUmaLog = path.join(logDir, "mcp_uma.log");
export const sentinelLog = path.join(logDir, "sentinel_watcher.log");
export const bridgeLog = path.join(logDir, "mcp_bridge.log");
export const webLog = path.join(logDir, "web.log");
export const consolidationLog = path.join(logDir, "consolidation_scheduler.log");

const isWin = process.platform === "win32";

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
      return stdout.includes(`:${port} `) && stdout.includes("LISTENING");
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

export async function stopServices() {
  console.log("");
  console.log(" SOGNA — Apagado manual");
  console.log(" ======================");
  for (const port of ports) {
    console.log(`[SOGNA] Puerto ${port}...`);
    await killPort(port);
  }
  console.log("[OK] Servicios detenidos.");
}

function spawnBackground(command, args, cwd, logFile) {
  ensureLogDir();
  const logFd = openSync(logFile, "a");
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    shell: false,
    windowsHide: true,
  });
  child.unref();
}

export async function waitForUmaHealth(maxAttempts = 90) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:8080/health", {
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

export async function startResident() {
  assertProject();
  const python = resolvePython();
  if (!existsSync(python) && python.includes(".venv")) {
    throw new Error(`Python no encontrado: ${python}`);
  }
  ensureLogDir();

  if (await anyPortBusy()) {
    console.log(
      "[SOGNA] Servicios ya activos o puertos ocupados. Use apagar/off si necesita reiniciar.",
    );
    return 0;
  }

  logLine(residentLog, "Arranque residente");

  console.log("[1/5] API UMA 8080...");
  spawnBackground(
    python,
    [path.join(projectRoot, "memory", "identity", "uma_server.py")],
    projectRoot,
    residentLog,
  );

  const umaReady = await waitForUmaHealth();
  if (!umaReady) {
    console.log(
      "[WARN] API UMA 8080 no respondio a tiempo; MCP UMA puede fallar hasta que cargue Chroma.",
    );
  }

  console.log("[2/5] MCP UMA 8000...");
  spawnBackground(
    python,
    [path.join(projectRoot, "memory", "identity", "mcp_uma_server.py")],
    projectRoot,
    mcpUmaLog,
  );

  console.log("[3/5] Sentinel Watcher...");
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
  spawnBackground("node", [watcher], projectRoot, sentinelLog);

  console.log("[4/5] MCP Bridge 8001 (background)...");
  const bridge = path.join(projectRoot, "engines", "MCP-Bridge", "build", "index.js");
  spawnBackground("node", [bridge], projectRoot, bridgeLog);

  console.log("[5/5] Sogna Web App (Vite puerto 5173)...");
  const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";
  spawnBackground(pnpmCmd, ["sogna:dev"], projectRoot, webLog);

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
  console.log("[4/4] MCP Bridge (8001) — Ctrl+C para detener");
  console.log(` Dashboard: ${dashboardUrl}`);
  const bridge = path.join(projectRoot, "engines", "MCP-Bridge", "build", "index.js");
  return new Promise((resolve) => {
    const child = spawn("node", [bridge], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
    child.on("exit", (c) => resolve(c ?? 0));
  });
}
