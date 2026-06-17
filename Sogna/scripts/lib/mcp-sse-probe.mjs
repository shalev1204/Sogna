#!/usr/bin/env node
/**
 * @returns {Record<string, string>}
 */
export function mcpAuthHeaders() {
  const token = process.env.SOGNA_MCP_TOKEN?.trim();
  /** @type {Record<string, string>} */
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * @param {string} url
 * @returns {string}
 */
export function withMcpAuthUrl(url) {
  const token = process.env.SOGNA_MCP_TOKEN?.trim();
  if (!token) return url;
  const u = new URL(url);
  if (!u.searchParams.has("token")) {
    u.searchParams.set("token", token);
  }
  return u.toString();
}

/**
 * Sondeo MCP SSE: GET /sse + POST initialize (contrato real de mcp-remote / Cursor).
 */

/** @typedef {"auto" | "fastmcp" | "sognatore"} McpSseTransport */

/**
 * @param {string} sseUrl
 * @returns {URL}
 */
function sseBaseUrl(sseUrl) {
  const u = new URL(sseUrl);
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u;
}

/**
 * @param {string} chunk
 * @returns {{ postPath: string; transport: "fastmcp" | "sognatore" } | null}
 */
function parseEndpointFromSse(chunk) {
  const fastmcp = chunk.match(/data:\s*(\/messages\/\?session_id=[^\s\r\n]+)/i);
  if (fastmcp) {
    return { postPath: fastmcp[1], transport: "fastmcp" };
  }
  const sognatore = chunk.match(/data:\s*(\/message\?sessionId=[^\s\r\n]+)/i);
  if (sognatore) {
    return { postPath: sognatore[1], transport: "sognatore" };
  }
  const rel = chunk.match(/sessionId=([a-f0-9-]+)/i);
  if (rel) {
    return { postPath: `/message?sessionId=${rel[1]}`, transport: "sognatore" };
  }
  const relFast = chunk.match(/session_id=([a-f0-9]+)/i);
  if (relFast) {
    return { postPath: `/messages/?session_id=${relFast[1]}`, transport: "fastmcp" };
  }
  return null;
}

/**
 * @param {{
 *   name: string;
 *   sseUrl: string;
 *   transport?: McpSseTransport;
 *   timeoutMs?: number;
 * }} opts
 * @returns {Promise<{
 *   name: string;
 *   ok: boolean;
 *   step: string;
 *   status?: number;
 *   detail?: string;
 *   transport?: string;
 * }>}
 */
export async function probeMcpSseInitialize(opts) {
  const { name } = opts;
  const sseUrl = withMcpAuthUrl(opts.sseUrl);
  const timeoutMs = opts.timeoutMs ?? 8000;
  const expectedTransport = opts.transport ?? "auto";
  const authHeaders = mcpAuthHeaders();

  /** @type {Response | null} */
  let sseRes = null;
  try {
    sseRes = await Promise.race([
      fetch(sseUrl, { headers: authHeaders }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms en GET /sse`)), timeoutMs);
      }),
    ]);

    if (!sseRes.ok) {
      return {
        name,
        ok: false,
        step: "sse-get",
        status: sseRes.status,
        detail: `HTTP ${sseRes.status}`,
      };
    }

    const reader = sseRes.body?.getReader();
    if (!reader) {
      return { name, ok: false, step: "sse-body", detail: "sin body en respuesta SSE" };
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let endpoint = null;
    const readDeadline = Date.now() + timeoutMs;

    while (!endpoint && Date.now() < readDeadline) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      endpoint = parseEndpointFromSse(buffer);
    }

    if (!endpoint) {
      await reader.cancel().catch(() => {});
      return {
        name,
        ok: false,
        step: "endpoint",
        detail: `sin endpoint MCP en SSE (${buffer.slice(0, 160)})`,
      };
    }

    if (expectedTransport !== "auto" && endpoint.transport !== expectedTransport) {
      await reader.cancel().catch(() => {});
      return {
        name,
        ok: false,
        step: "transport",
        detail: `esperado ${expectedTransport}, recibido ${endpoint.transport}`,
        transport: endpoint.transport,
      };
    }

    const base = sseBaseUrl(sseUrl);
    const messageUrl = new URL(endpoint.postPath, base).toString();
    const initRes = await Promise.race([
      fetch(messageUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 0,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "sogna-mcp-probe", version: "1.0.0" },
          },
        }),
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms en POST initialize`)), timeoutMs);
      }),
    ]);

    const initBody = await initRes.text();
    await reader.cancel().catch(() => {});

    const ok =
      initRes.status >= 200 &&
      initRes.status < 300 &&
      !initBody.toLowerCase().includes("stream is not readable");

    return {
      name,
      ok,
      step: "initialize",
      status: initRes.status,
      detail: ok ? "Accepted" : initBody.slice(0, 200),
      transport: endpoint.transport,
    };
  } catch (e) {
    return {
      name,
      ok: false,
      step: "error",
      detail: e instanceof Error ? e.message : String(e),
    };
  } finally {
    try {
      await sseRes?.body?.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Sondeo Streamable HTTP (POST /sse) — mismo endpoint que usa mcp-remote en http-first.
 * @param {{ name: string; sseUrl: string; timeoutMs?: number }} opts
 */
export async function probeStreamableInitialize(opts) {
  const { name } = opts;
  const sseUrl = withMcpAuthUrl(opts.sseUrl);
  const timeoutMs = opts.timeoutMs ?? 8000;
  const authHeaders = mcpAuthHeaders();
  try {
    const initRes = await Promise.race([
      fetch(sseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...authHeaders,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 0,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "sogna-streamable-probe", version: "1.0.0" },
          },
        }),
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms en POST streamable`)), timeoutMs);
      }),
    ]);
    const sessionId = initRes.headers.get("mcp-session-id");
    const body = await initRes.text();
    const ok =
      initRes.status >= 200 &&
      initRes.status < 300 &&
      Boolean(sessionId) &&
      !body.toLowerCase().includes("cannot post");
    return {
      name,
      ok,
      step: "streamable-post",
      status: initRes.status,
      detail: ok ? `session ${sessionId?.slice(0, 8)}…` : body.slice(0, 160),
    };
  } catch (e) {
    return {
      name,
      ok: false,
      step: "streamable-post",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Streamable HTTP: initialize + tools/list — paridad con mcp.contract.json (Sognatore).
 * @param {{ name: string; sseUrl: string; expectedTools: string[]; timeoutMs?: number }} opts
 */
export async function probeStreamableToolsList(opts) {
  const { name, expectedTools } = opts;
  const sseUrl = withMcpAuthUrl(opts.sseUrl);
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const authHeaders = mcpAuthHeaders();
  try {
    const initRes = await fetch(sseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...authHeaders,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "sogna-tools-probe", version: "1.0.0" },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const sessionId = initRes.headers.get("mcp-session-id");
    if (!sessionId) {
      return {
        name,
        ok: false,
        step: "tools-list-init",
        detail: `sin mcp-session-id (${await initRes.text().then((t) => t.slice(0, 120))})`,
      };
    }

    const listRes = await fetch(sseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId,
        ...authHeaders,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const raw = await listRes.text();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // SSE-style multi-line: tomar última línea data:
      const dataLine = raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("data:"))
        .pop();
      if (dataLine) {
        parsed = JSON.parse(dataLine.replace(/^data:\s*/, ""));
      }
    }

    const tools = Array.isArray(parsed?.result?.tools)
      ? parsed.result.tools.map((t) => t?.name).filter(Boolean)
      : [];
    const missing = expectedTools.filter((t) => !tools.includes(t));
    const extra = tools.filter((t) => !expectedTools.includes(t));

    return {
      name,
      ok: missing.length === 0 && listRes.status >= 200 && listRes.status < 300,
      step: "tools-list",
      status: listRes.status,
      detail:
        missing.length === 0
          ? `${tools.length} tools (contract ${expectedTools.length})`
          : `faltan: ${missing.join(", ")}${extra.length ? `; extra: ${extra.slice(0, 5).join(", ")}` : ""}`,
      tools,
    };
  } catch (e) {
    return {
      name,
      ok: false,
      step: "tools-list",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Sondeo HTTP superficial (GET).
 * @param {{ name: string; url: string; timeoutMs?: number }} opts
 */
export async function probeHttpReachable(opts) {
  const timeoutMs = opts.timeoutMs ?? 5000;
  /** @type {Response | null} */
  let res = null;
  try {
    res = await Promise.race([
      fetch(opts.url),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    const ok = res.status >= 200 && res.status < 400;
    return { name: opts.name, url: opts.url, ok, status: res.status };
  } catch (e) {
    return {
      name: opts.name,
      url: opts.url,
      ok: false,
      status: null,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    try {
      await res?.body?.cancel();
    } catch {
      // ignore
    }
  }
}
