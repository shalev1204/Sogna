#!/usr/bin/env node
/**
 * Verifica comandos CLI dispatch / worker (Fase 2).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");
const cli = path.join(sognaRoot, "Curator", "bin", "sognatore.js");

function parseJsonOutput(out) {
  const cleaned = out.replace(/\x1b\[[0-9;]*m/g, "").trim();
  const lines = cleaned.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error(`sin JSON en salida: ${cleaned.slice(0, 120)}`);
  return JSON.parse(lines.slice(start).join("\n"));
}

let failed = 0;

function run(args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [cli, ...args], {
      cwd: sognaRoot,
      env: {
        ...process.env,
        SOGNATORE_KEYLESS: "true",
        SOGNA_LOCAL_MODE: "true",
        SOGNA_QUIET: "true",
      },
      shell: false,
      windowsHide: true,
    });
    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => { out += d; });
    child.stderr?.on("data", (d) => { err += d; });
    const t = setTimeout(() => {
      child.kill();
      reject(new Error("timeout"));
    }, timeoutMs);
    child.on("close", (code) => {
      clearTimeout(t);
      if (code !== 0) reject(new Error(err || out || `exit ${code}`));
      else resolve(out);
    });
    child.on("error", reject);
  });
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`[OK] ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`[FAIL] ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

await check("dispatch --task (brief json)", async () => {
  const out = await run(["dispatch", "--task", "auditar seguridad", "--json"]);
  const data = parseJsonOutput(out);
  if (!data.brief || data.brief.length < 80) throw new Error("sin brief");
});

await check("dispatch --agent orchestrator", async () => {
  const out = await run(["dispatch", "--agent", "orchestrator", "--json"]);
  const data = parseJsonOutput(out);
  if (!data.brief?.includes("orchestrator")) throw new Error("sin brief");
});

await check("worker-scripts", async () => {
  const out = await run(["worker-scripts"]);
  if (!out.includes("mcp-clients")) throw new Error("sin mcp-clients");
});

await check("worker-enqueue --wait", async () => {
  const out = await run(
    ["worker-enqueue", "--kind", "script", "--action", "mcp-clients", "--wait", "--json"],
    90000,
  );
  const data = parseJsonOutput(out);
  if (data.status !== "completed") throw new Error(`status=${data.status}`);
});

await check("worker-list --json", async () => {
  const out = await run(["worker-list", "--json"]);
  const data = parseJsonOutput(out);
  if (!Array.isArray(data) || data.length < 1) throw new Error("lista vacía");
});

if (failed > 0) {
  console.error(`\n${failed} fallo(s). Ejecute: pnpm --filter Sognatore build`);
  process.exit(1);
}

console.log("\nDispatch CLI OK.");
