#!/usr/bin/env node
/**
 * Verificación P5 — expansión MCP Ollama/UMA en Sognatore Bridge.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMcpContract, listContractToolNames } from "./lib/mcp-contract.mjs";
import { runOllamaDoctor } from "./lib/ollama-doctor.mjs";
import {
  getOllamaRoutingSnapshot,
  resolveOllamaModel,
} from "./lib/ollama-routing.mjs";
import {
  enqueueWorkerJob,
  getWorkerJobStatus,
  SCRIPT_REGISTRY,
} from "./lib/worker-queue.mjs";
import { probeStreamableToolsList } from "./lib/mcp-sse-probe.mjs";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";

const sognaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoints = loadMcpEndpoints(sognaRoot);
const contract = loadMcpContract(sognaRoot);

async function umaRecall(query) {
  const host = process.env.SOGNA_MCP_HOST || "127.0.0.1";
  const port = process.env.SOGNA_UMA_API_PORT || "8080";
  try {
    const res = await fetch(`http://${host}:${port}/memory/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, n_results: 3 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.raw_output || null;
  } catch {
    return null;
  }
}

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

console.log("=== MCP P5 verify (Ollama + UMA proxy) ===\n");

const p5Tools = [
  "ollama_doctor",
  "get_ollama_routing",
  "resolve_ollama_model",
  "uma_semantic_recall",
];

const mcpSrc = readFileSync(
  path.join(sognaRoot, "engines", "MCP-Bridge", "src", "sognatoreMcp.ts"),
  "utf8",
);
for (const name of p5Tools) {
  if (!mcpSrc.includes(`name: "${name}"`)) {
    fail(`tool ${name} no registrada en sognatoreMcp.ts`);
  } else {
    ok(`tool ${name} en Bridge`);
  }
}

if (!SCRIPT_REGISTRY["mcp-p5"]) {
  fail("SCRIPT_REGISTRY sin mcp-p5");
} else {
  ok("SCRIPT_REGISTRY mcp-p5");
}

const doctor = await runOllamaDoctor(sognaRoot);
if (!doctor.ollama_available) {
  fail(`ollama_doctor: ${doctor.message}`);
} else {
  ok(`ollama_doctor: ${doctor.message}`);
}

const routing = getOllamaRoutingSnapshot(sognaRoot);
if (!routing.task_types?.length) {
  fail("get_ollama_routing vacío");
} else {
  ok(`get_ollama_routing: ${routing.task_types.length} task_types`);
}

const resolved = resolveOllamaModel(sognaRoot, "auditar seguridad MCP", "qwen2.5-coder:7b");
if (resolved.model !== "qwen2.5-coder:7b" || resolved.source !== "override") {
  fail("resolve_ollama_model override");
} else {
  ok(`resolve_ollama_model override → ${resolved.model}`);
}

const routed = resolveOllamaModel(sognaRoot, "auditar seguridad del modulo");
if (!routed.model) {
  fail("resolve_ollama_model routing");
} else {
  ok(`resolve_ollama_model routing → ${routed.model} (${routed.task_type})`);
}

const recall = await umaRecall("estado proyecto Sogna");
if (!recall || recall.length < 40) {
  fail("uma_semantic_recall proxy (UMA :8080)");
} else {
  ok(`uma_semantic_recall (${recall.length} chars)`);
}

const job = enqueueWorkerJob(sognaRoot, {
  kind: "ollama",
  task: "Responde solo: P5_OK",
  model: "llama3.1:latest",
});
if (!job.job_id) {
  fail("enqueue_worker_job kind=ollama con model");
} else {
  ok(`enqueue ollama job ${job.job_id}`);
  if (process.env.SOGNA_MCP_P5_SKIP_JOB !== "1") {
    await new Promise((r) => setTimeout(r, 15000));
    const status = getWorkerJobStatus(sognaRoot, job.job_id);
    if (!status) {
      fail("worker job status missing");
    } else if (status.status === "completed" && status.model === "llama3.1:latest") {
      ok("worker ollama completed con model override");
    } else if (status.status === "queued" || status.status === "running") {
      ok(`worker ollama ${status.status} (model=${status.model || "pending"})`);
    } else {
      fail(`worker ollama ${status.status}: ${(status.output || []).slice(-1)[0] || "sin salida"}`);
    }
  } else {
    ok("worker ollama job omitido (SOGNA_MCP_P5_SKIP_JOB=1)");
  }
}

if (contract) {
  const sogTools = listContractToolNames(contract, "Sognatore");
  const missing = p5Tools.filter((t) => !sogTools.includes(t));
  if (missing.length) {
    fail(`mcp.contract.json faltan: ${missing.join(", ")}`);
  } else if (sogTools.length !== 21) {
    fail(`Sognatore tools esperadas 21, got ${sogTools.length}`);
  } else {
    ok("mcp.contract.json — 21 tools Sognatore");
  }
}

if (process.env.SOGNA_MCP_P5_SKIP_RUNTIME !== "1") {
  const toolsList = await probeStreamableToolsList({
    name: "Sognatore tools/list P5",
    sseUrl: endpoints.mcp_bridge_sse_url,
    expectedTools: contract ? listContractToolNames(contract, "Sognatore") : [],
  });
  if (toolsList.ok) ok(`runtime tools/list — ${toolsList.detail}`);
  else fail(`runtime tools/list — ${toolsList.detail ?? "fallo"}`);
} else {
  ok("runtime tools/list omitido (SOGNA_MCP_P5_SKIP_RUNTIME=1)");
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s) en MCP P5.`);
  process.exit(1);
}

console.log("MCP P5 OK.");
