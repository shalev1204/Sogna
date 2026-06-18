#!/usr/bin/env node
/**
 * Doctor MCP Sogna: config + contrato + clientes + health + handshake MCP.
 * SOGNA_MCP_DOCTOR_SKIP_CONFIG=1 — omite auto_config_mcp.py.
 * SOGNA_MCP_DOCTOR_CI=1 — valida .mcp.json del repo; omite health/handshake (sin stack local).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { loadMcpEndpoints } from "./lib/mcp-endpoints.mjs";
import { probeHttpReachable, probeMcpSseInitialize, probeStreamableInitialize, probeStreamableToolsList } from "./lib/mcp-sse-probe.mjs";
import { loadMcpContract, listContractToolNames } from "./lib/mcp-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");
const endpoints = loadMcpEndpoints(sognaRoot);
const mcpContract = loadMcpContract(sognaRoot);
const ciMode = process.env.SOGNA_MCP_DOCTOR_CI === "1";
const skipConfig = ciMode || process.env.SOGNA_MCP_DOCTOR_SKIP_CONFIG === "1";

const gitRoot =
  sognaRoot.endsWith(`${path.sep}Sogna`) &&
  existsSync(path.join(path.dirname(sognaRoot), "Sogna", "platform.manifest.json"))
    ? path.dirname(sognaRoot)
    : sognaRoot;

let failed = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed += 1;
}

function warn(msg) {
  console.log(`[WARN] ${msg}`);
}

console.log("=== Sogna MCP Doctor ===");
if (ciMode) console.log("Modo CI — sin health/handshake en runtime local");
console.log(
  `Host ${endpoints.host} | UMA API :${endpoints.uma_api_port} | UMA MCP :${endpoints.mcp_uma_port} | Bridge :${endpoints.mcp_bridge_port}`,
);
console.log("");

// [1/5] Config clientes
if (skipConfig) {
  const reason = ciMode ? "CI" : "SOGNA_MCP_DOCTOR_SKIP_CONFIG=1";
  ok(`[1/5] Config clientes omitida (${reason})`);
} else {
  console.log("[1/5] Sincronizando clientes MCP...");
  const cfg = spawnSync("python", [path.join(sognaRoot, "Curator", "scripts", "auto_config_mcp.py")], {
    cwd: sognaRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (cfg.stdout?.trim()) process.stdout.write(cfg.stdout);
  if (cfg.stderr?.trim()) process.stderr.write(cfg.stderr);
  if (cfg.status === 0) ok("[1/5] Clientes MCP sincronizados");
  else fail(`[1/5] auto_config_mcp.py exit ${cfg.status ?? 1}`);
}
console.log("");

// [2/5] Contrato
console.log("[2/5] Contrato MCP (mcp.contract.json)...");
const contractRun = spawnSync("node", [path.join(sognaRoot, "scripts", "verify-mcp-contract.mjs")], {
  cwd: sognaRoot,
  encoding: "utf8",
  windowsHide: true,
});
if (contractRun.stdout?.trim()) process.stdout.write(contractRun.stdout);
if (contractRun.status === 0) ok("[2/5] Contrato MCP alineado con código");
else {
  if (contractRun.stderr?.trim()) process.stderr.write(contractRun.stderr);
  fail("[2/5] verify-mcp-contract falló");
}
console.log("");

// [3/5] Registro clientes MCP
console.log(ciMode ? "[3/5] Registro proyecto (.mcp.json)..." : "[3/5] Registro Cursor...");
if (ciMode) {
  const projectMcp = path.join(gitRoot, ".mcp.json");
  if (!existsSync(projectMcp)) {
    fail(`[3/5] Proyecto sin .mcp.json en ${projectMcp}`);
  } else {
    try {
      const data = JSON.parse(readFileSync(projectMcp, "utf8"));
      const servers = data.mcpServers ?? {};
      for (const name of ["UMA", "Sognatore"]) {
        if (!servers[name]) {
          fail(`[3/5] .mcp.json sin servidor ${name}`);
          continue;
        }
        const url = servers[name]?.args?.slice(-1)[0] ?? "";
        const expected =
          name === "UMA" ? endpoints.mcp_uma_sse_url : endpoints.mcp_bridge_sse_url;
        if (url === expected) ok(`[3/5] .mcp.json ${name} → ${url}`);
        else fail(`[3/5] .mcp.json ${name} URL ${url} ≠ SSOT ${expected}`);
      }
    } catch (e) {
      fail(`[3/5] .mcp.json inválido: ${e instanceof Error ? e.message : e}`);
    }
  }
} else {
  const cursorMcp = path.join(homedir(), ".cursor", "mcp.json");
  if (!existsSync(cursorMcp)) {
    fail("[3/5] Cursor: no existe mcp.json");
  } else {
    try {
      const data = JSON.parse(readFileSync(cursorMcp, "utf8"));
      const servers = data.mcpServers ?? {};
      const missing = ["UMA", "Sognatore"].filter((n) => !servers[n]);
      if (missing.length) fail(`[3/5] Cursor: faltan ${missing.join(", ")}`);
      else {
        const umaUrl = servers.UMA?.args?.slice(-1)[0] ?? "";
        const sogUrl = servers.Sognatore?.args?.slice(-1)[0] ?? "";
        if (umaUrl !== endpoints.mcp_uma_sse_url) {
          warn(`UMA URL desalineada (pnpm mcp:config)`);
        }
        if (sogUrl !== endpoints.mcp_bridge_sse_url) {
          warn(`Sognatore URL desalineada (pnpm mcp:config)`);
        }
        ok("[3/5] Cursor: UMA + Sognatore");
      }
    } catch (e) {
      fail(`[3/5] Cursor JSON: ${e instanceof Error ? e.message : e}`);
    }
  }
}
console.log("");

// [4/5] Health endpoints
if (ciMode) {
  ok("[4/5] Health runtime omitido (CI sin stack local)");
  ok("[5/5] Handshake MCP omitido (CI sin stack local)");
} else {
  console.log("[4/5] Health runtime...");
  const [umaApi, umaMcpHealth, umaMcpReady, bridgeHealth, bridgeReady, bridgeMetrics] =
    await Promise.all([
    probeHttpReachable({ name: "UMA API", url: endpoints.uma_api_health_url }),
    probeHttpReachable({ name: "UMA MCP /health", url: endpoints.mcp_uma_health_url }),
    probeHttpReachable({ name: "UMA MCP /ready", url: endpoints.mcp_uma_ready_url }),
    probeHttpReachable({ name: "Bridge /health", url: endpoints.mcp_bridge_health_url }),
    probeHttpReachable({ name: "Bridge /ready", url: endpoints.mcp_bridge_ready_url }),
    probeHttpReachable({ name: "Bridge /metrics", url: endpoints.mcp_bridge_metrics_url }),
  ]);
  if (umaApi.ok) ok(`UMA API HTTP ${umaApi.status}`);
  else fail(`UMA API — ${umaApi.error ?? "caída"} (pnpm sogna:on)`);
  if (umaMcpHealth.ok) ok(`UMA MCP /health HTTP ${umaMcpHealth.status}`);
  else fail(`UMA MCP /health — ${umaMcpHealth.error ?? "caída"}`);
  if (umaMcpReady.ok) ok(`UMA MCP /ready HTTP ${umaMcpReady.status}`);
  else fail(`UMA MCP /ready — ${umaMcpReady.error ?? "UMA API no lista"}`);
  if (bridgeHealth.ok) ok(`Bridge /health HTTP ${bridgeHealth.status}`);
  else fail(`Bridge /health — ${bridgeHealth.error ?? "caída"}`);
  if (bridgeReady.ok) ok(`Bridge /ready HTTP ${bridgeReady.status}`);
  else fail(`Bridge /ready — ${bridgeReady.error ?? "no listo"}`);
  if (bridgeMetrics.ok) ok(`Bridge /metrics HTTP ${bridgeMetrics.status}`);
  else fail(`Bridge /metrics — ${bridgeMetrics.error ?? "caído"}`);
  console.log("");

  // [5/5] Handshake MCP
  console.log("[5/5] Handshake MCP (Streamable + SSE legacy)...");
  const streamable = await probeStreamableInitialize({
    name: "Sognatore Streamable",
    sseUrl: endpoints.mcp_bridge_sse_url,
  });
  if (streamable.ok) ok(`Sognatore Streamable POST ${streamable.status}`);
  else fail(`Sognatore Streamable — ${streamable.detail ?? "fallo"}`);

  const umaStreamable = await probeStreamableInitialize({
    name: "UMA Streamable",
    sseUrl: endpoints.mcp_uma_sse_url,
  });
  if (umaStreamable.ok) ok(`UMA Streamable POST ${umaStreamable.status}`);
  else fail(`UMA Streamable — ${umaStreamable.detail ?? "fallo"}`);

  const probes = await Promise.all([
    probeMcpSseInitialize({
      name: "UMA",
      sseUrl: endpoints.mcp_uma_sse_url,
      transport: "fastmcp",
    }),
    probeMcpSseInitialize({
      name: "Sognatore",
      sseUrl: endpoints.mcp_bridge_sse_url,
      transport: "sognatore",
    }),
  ]);
for (const r of probes) {
  if (r.ok) ok(`${r.name} initialize HTTP ${r.status}`);
  else fail(`${r.name} — ${r.step}: ${r.detail ?? "fallo"}`);
}

if (mcpContract) {
  const sogTools = listContractToolNames(mcpContract, "Sognatore");
  const toolsList = await probeStreamableToolsList({
    name: "Sognatore tools/list",
    sseUrl: endpoints.mcp_bridge_sse_url,
    expectedTools: sogTools,
  });
  if (toolsList.ok) ok(`Sognatore tools/list — ${toolsList.detail}`);
  else fail(`Sognatore tools/list — ${toolsList.detail ?? "fallo"}`);
}
}

console.log("");
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallida(s).`);
  if (!ciMode) {
    console.error("pnpm sogna:on → pnpm mcp:doctor → reiniciar MCP en Cursor.");
  }
  process.exit(1);
}

console.log(ciMode ? "MCP Doctor CI OK." : "MCP Doctor OK — pila local lista para IDE.");
