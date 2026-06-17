/** Métricas y telemetría MCP del Bridge — P3 observabilidad. */

export interface McpToolCallRecord {
  ts: string;
  tool: string;
  ms: number;
  ok: boolean;
  session?: string;
  error?: string;
}

export interface McpMetricsSnapshot {
  started_at: string;
  uptime_s: number;
  tool_calls_total: number;
  tool_errors_total: number;
  vetoes_total: number;
  rate_limits_total: number;
  write_denials_total: number;
  circuit_breaker_trips: number;
  sse_connections_total: number;
  streamable_sessions: number;
  sse_legacy_sessions: number;
  tool_calls_by_name: Record<string, number>;
  recent_tool_calls: McpToolCallRecord[];
}

const startedAt = Date.now();
let toolCallsTotal = 0;
let toolErrorsTotal = 0;
let vetoesTotal = 0;
let rateLimitsTotal = 0;
let writeDenialsTotal = 0;
let circuitBreakerTrips = 0;
let sseConnectionsTotal = 0;

const toolCallsByName = new Map<string, number>();
const recentToolCalls: McpToolCallRecord[] = [];
const RECENT_MAX = 40;

function bumpToolName(name: string): void {
  toolCallsByName.set(name, (toolCallsByName.get(name) || 0) + 1);
}

function pushRecent(record: McpToolCallRecord): void {
  recentToolCalls.push(record);
  while (recentToolCalls.length > RECENT_MAX) {
    recentToolCalls.shift();
  }
}

function jsonLog(event: string, payload: Record<string, unknown>): void {
  if (process.env.SOGNA_MCP_JSON_LOGS !== "1") return;
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, ...payload }));
}

export function recordSseConnection(): void {
  sseConnectionsTotal += 1;
  jsonLog("mcp.sse.connect", { total: sseConnectionsTotal });
}

export function recordCircuitBreakerTrip(): void {
  circuitBreakerTrips += 1;
  jsonLog("mcp.circuit_breaker", { trips: circuitBreakerTrips });
}

export function recordWriteDenial(tool: string, sessionId?: string): void {
  writeDenialsTotal += 1;
  jsonLog("mcp.write_denied", { tool, session: sessionId?.slice(0, 8) });
}

export function recordRateLimit(tool: string, sessionId?: string): void {
  rateLimitsTotal += 1;
  jsonLog("mcp.rate_limit", { tool, session: sessionId?.slice(0, 8) });
}

export function recordVeto(tool: string, kind: "pre" | "sentinel", sessionId?: string): void {
  vetoesTotal += 1;
  jsonLog("mcp.veto", { tool, kind, session: sessionId?.slice(0, 8) });
}

export function recordToolResult(
  tool: string,
  ms: number,
  ok: boolean,
  sessionId?: string,
  error?: string,
): void {
  toolCallsTotal += 1;
  if (!ok) toolErrorsTotal += 1;
  bumpToolName(tool);
  pushRecent({
    ts: new Date().toISOString(),
    tool,
    ms,
    ok,
    session: sessionId?.slice(0, 8),
    error: error?.slice(0, 120),
  });
  jsonLog("mcp.tool", { tool, ms, ok, session: sessionId?.slice(0, 8) });
}

export function getMcpMetrics(
  sseLegacySessions: number,
  streamableSessions: number,
): McpMetricsSnapshot {
  const byName: Record<string, number> = {};
  for (const [k, v] of toolCallsByName) {
    byName[k] = v;
  }
  return {
    started_at: new Date(startedAt).toISOString(),
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    tool_calls_total: toolCallsTotal,
    tool_errors_total: toolErrorsTotal,
    vetoes_total: vetoesTotal,
    rate_limits_total: rateLimitsTotal,
    write_denials_total: writeDenialsTotal,
    circuit_breaker_trips: circuitBreakerTrips,
    sse_connections_total: sseConnectionsTotal,
    streamable_sessions: streamableSessions,
    sse_legacy_sessions: sseLegacySessions,
    tool_calls_by_name: byName,
    recent_tool_calls: [...recentToolCalls],
  };
}
