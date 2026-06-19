#!/usr/bin/env node
/**
 * redis-probe.mjs — comprueba conectividad Redis y estado del contenedor.
 * Uso: node scripts/redis-probe.mjs [--json] [--wait <segundos>]
 */
import { createConnection } from "node:net";
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Cargar .env
try {
  const { loadSognaDotenv } = await import("./lib/load-dotenv.mjs");
  loadSognaDotenv(projectRoot);
} catch { /* sin .env */ }

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const waitArg = args.indexOf("--wait");
const waitSecs = waitArg >= 0 ? parseInt(args[waitArg + 1] || "10", 10) : 0;

function parseRedisUrl(url) {
  try {
    const u = new URL(url || "redis://localhost:6379/0");
    return { host: u.hostname || "localhost", port: parseInt(u.port || "6379", 10) };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

function tcpPing(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const sock = createConnection({ host, port });
    sock.setTimeout(timeoutMs);
    sock.on("connect", () => { sock.destroy(); resolve(true); });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => { sock.destroy(); resolve(false); });
  });
}

function dockerContainerStatus() {
  try {
    const out = spawnSync(
      "docker",
      ["inspect", "--format", "{{.State.Status}}", "sogna_redis"],
      { encoding: "utf8" },
    );
    if (out.status === 0) return out.stdout.trim();
    return "not_found";
  } catch {
    return "docker_unavailable";
  }
}

async function probe(attempt = 1) {
  const url = process.env.REDIS_URL || "redis://localhost:6379/0";
  const { host, port } = parseRedisUrl(url);
  const container = dockerContainerStatus();
  const reachable = await tcpPing(host, port);

  const result = {
    ok: reachable,
    host,
    port,
    url,
    container,
    attempt,
  };

  if (jsonMode) {
    process.stdout.write(JSON.stringify(result) + "\n");
  } else {
    const icon = reachable ? "OK" : "FAIL";
    console.log(`[redis-probe] ${icon}  ${host}:${port}  container=${container}`);
  }

  return reachable;
}

if (waitSecs > 0) {
  const deadline = Date.now() + waitSecs * 1000;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    const ok = await probe(attempt);
    if (ok) process.exit(0);
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!jsonMode) console.error(`[redis-probe] Redis no respondio en ${waitSecs}s`);
  process.exit(1);
} else {
  const ok = await probe();
  process.exit(ok ? 0 : 1);
}
