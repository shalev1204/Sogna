#!/usr/bin/env node
/**
 * SSOT puertos y URLs de la pila MCP local Sogna.
 * Defaults: platform.manifest.json → local_services; override: variables de entorno.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** @type {{ host: string; uma_api: number; mcp_uma: number; mcp_bridge: number; web: number }} */
const MANIFEST_DEFAULTS = {
  host: "127.0.0.1",
  uma_api: 8080,
  mcp_uma: 8000,
  mcp_bridge: 8001,
  web: 5173,
};

/**
 * @param {string | undefined} envName
 * @param {number} fallback
 * @returns {number}
 */
function parsePortEnv(envName, fallback) {
  const raw = process.env[envName];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : fallback;
}

/**
 * @param {string} sognaRoot
 * @returns {{
 *   host: string;
 *   uma_api_port: number;
 *   mcp_uma_port: number;
 *   mcp_bridge_port: number;
 *   web_port: number;
 *   uma_api_health_url: string;
 *   mcp_uma_sse_url: string;
 *   mcp_bridge_sse_url: string;
 *   mcp_bridge_dashboard_url: string;
 *   all_ports: number[];
 * }}
 */
export function loadMcpEndpoints(sognaRoot) {
  /** @type {typeof MANIFEST_DEFAULTS} */
  let fromManifest = { ...MANIFEST_DEFAULTS };
  const manifestPath = path.join(sognaRoot, "platform.manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const ls = manifest.local_services;
      if (ls && typeof ls === "object") {
        if (typeof ls.host === "string" && ls.host.trim()) {
          fromManifest.host = ls.host.trim();
        }
        const p = ls.ports;
        if (p && typeof p === "object") {
          for (const key of /** @type {const} */ (["uma_api", "mcp_uma", "mcp_bridge", "web"])) {
            const v = p[key];
            if (typeof v === "number" && v > 0 && v < 65536) {
              fromManifest[key] = v;
            }
          }
        }
      }
    } catch {
      // manifest opcional en runtime; defaults institucionales
    }
  }

  const host = (process.env.SOGNA_MCP_HOST || fromManifest.host).trim() || "127.0.0.1";
  const uma_api_port = parsePortEnv("SOGNA_UMA_API_PORT", fromManifest.uma_api);
  const mcp_uma_port = parsePortEnv("SOGNA_MCP_UMA_PORT", fromManifest.mcp_uma);
  const mcp_bridge_port = parsePortEnv("SOGNA_MCP_BRIDGE_PORT", fromManifest.mcp_bridge);
  const web_port = parsePortEnv("SOGNA_WEB_PORT", fromManifest.web);
  const origin = `http://${host}`;

  return {
    host,
    uma_api_port,
    mcp_uma_port,
    mcp_bridge_port,
    web_port,
    uma_api_health_url: `${origin}:${uma_api_port}/health`,
    mcp_uma_sse_url: `${origin}:${mcp_uma_port}/sse`,
    mcp_bridge_sse_url: `${origin}:${mcp_bridge_port}/sse`,
    mcp_bridge_dashboard_url: `${origin}:${mcp_bridge_port}/dashboard/`,
    mcp_bridge_health_url: `${origin}:${mcp_bridge_port}/health`,
    mcp_bridge_ready_url: `${origin}:${mcp_bridge_port}/ready`,
    mcp_bridge_metrics_url: `${origin}:${mcp_bridge_port}/metrics`,
    mcp_bridge_stack_url: `${origin}:${mcp_bridge_port}/mcp-stack`,
    all_ports: [uma_api_port, mcp_uma_port, mcp_bridge_port, web_port],
  };
}

/**
 * Variables de entorno para procesos hijos (Bridge, runtime).
 * @param {ReturnType<typeof loadMcpEndpoints>} endpoints
 * @returns {NodeJS.ProcessEnv}
 */
export function mcpEndpointsToEnv(endpoints) {
  return {
    ...process.env,
    SOGNA_MCP_HOST: endpoints.host,
    SOGNA_UMA_API_PORT: String(endpoints.uma_api_port),
    SOGNA_MCP_UMA_PORT: String(endpoints.mcp_uma_port),
    SOGNA_MCP_BRIDGE_PORT: String(endpoints.mcp_bridge_port),
    SOGNA_WEB_PORT: String(endpoints.web_port),
  };
}
