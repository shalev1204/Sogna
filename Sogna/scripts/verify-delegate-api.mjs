#!/usr/bin/env node
/**
 * Verifica API REST de delegación en MCP Bridge :8001
 */
const BASE = process.env.BRIDGE_URL || "http://127.0.0.1:8001";

let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`[OK] ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`[FAIL] ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

await check("GET /api/agents", async () => {
  const res = await fetch(`${BASE}/api/agents`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.count || data.count < 10) throw new Error(`count=${data.count}`);
});

await check("POST /api/route", async () => {
  const res = await fetch(`${BASE}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: "verificar seguridad sentinel" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.task_type) throw new Error("sin task_type");
});

await check("POST /api/brief", async () => {
  const res = await fetch(`${BASE}/api/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: "auditoria MCP", agent_id: "orchestrator" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.brief || data.brief.length < 50) throw new Error("brief vacío");
});

await check("GET /api/worker/scripts", async () => {
  const res = await fetch(`${BASE}/api/worker/scripts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.scripts?.includes("mcp-clients")) throw new Error("falta mcp-clients");
});

await check("POST /api/worker/enqueue + GET status", async () => {
  const enq = await fetch(`${BASE}/api/worker/enqueue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "script", action: "mcp-clients" }),
  });
  if (!enq.ok) throw new Error(`enqueue HTTP ${enq.status}`);
  const { job_id } = await enq.json();
  await new Promise((r) => setTimeout(r, 8000));
  const st = await fetch(`${BASE}/api/worker/jobs/${job_id}`);
  if (!st.ok) throw new Error(`status HTTP ${st.status}`);
  const job = await st.json();
  if (job.status !== "completed" && job.status !== "running") {
    throw new Error(`status=${job.status}`);
  }
});

if (failed > 0) {
  console.error(`\n${failed} fallo(s). ¿pnpm sogna:on activo?`);
  process.exit(1);
}

console.log("\nDelegate API OK.");
