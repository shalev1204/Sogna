/** Tiers de herramientas MCP — alineado con mcp.contract.json */

export const MCP_TOOL_TIERS = {
  L0: new Set([
    "get_swarm_telemetry",
    "read_audit_logs",
    "verify_sentinel_integrity",
    "get_sentinel_status",
    "get_memory_graph_telemetry",
    "run_synaptic_validation",
    "list_agents",
    "get_agent_playbook",
    "get_project_context",
    "get_worker_job_status",
    "list_worker_jobs",
  ]),
  L1: new Set(["route_task", "resolve_dept_agent", "build_dispatch_brief"]),
  L2: new Set(["enqueue_worker_job"]),
  L3: new Set(["update_swarm_mission", "run_consolidation_pipeline"]),
} as const;

const WRITE_TOOLS = new Set([...MCP_TOOL_TIERS.L2, ...MCP_TOOL_TIERS.L3]);

const ENQUEUE_LIMIT = Math.max(
  1,
  parseInt(process.env.SOGNA_MCP_ENQUEUE_LIMIT_PER_MIN || "6", 10) || 6,
);

/** Timeouts por tier (ms) — alineado con mcp.contract.json tool_timeouts_ms */
const TIER_TIMEOUT_MS: Record<"L0" | "L1" | "L2" | "L3", number> = {
  L0: Math.max(5_000, parseInt(process.env.SOGNA_MCP_TIMEOUT_L0_MS || "15000", 10) || 15_000),
  L1: Math.max(10_000, parseInt(process.env.SOGNA_MCP_TIMEOUT_L1_MS || "30000", 10) || 30_000),
  L2: Math.max(15_000, parseInt(process.env.SOGNA_MCP_TIMEOUT_L2_MS || "60000", 10) || 60_000),
  L3: Math.max(30_000, parseInt(process.env.SOGNA_MCP_TIMEOUT_L3_MS || "120000", 10) || 120_000),
};

/** sessionId → timestamps (ms) de enqueue_worker_job */
const enqueueHistory = new Map<string, number[]>();

/**
 * Herramientas L2/L3 requieren opt-in explícito del operador.
 */
export function checkMcpWritePolicy(toolName: string): { allowed: boolean; reason?: string } {
  if (!WRITE_TOOLS.has(toolName)) {
    return { allowed: true };
  }
  if (process.env.SOGNA_MCP_ALLOW_WRITE === "1") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason:
      `La herramienta '${toolName}' modifica estado local (tier L2/L3). ` +
      `Exporte SOGNA_MCP_ALLOW_WRITE=1 para habilitarla.`,
  };
}

/**
 * Rate limit por sesión MCP para enqueue_worker_job.
 */
export function checkEnqueueRateLimit(
  sessionId: string | undefined,
  toolName: string,
): { allowed: boolean; reason?: string } {
  if (toolName !== "enqueue_worker_job") {
    return { allowed: true };
  }
  const key = sessionId || "anonymous";
  const now = Date.now();
  const windowMs = 60_000;
  const prev = (enqueueHistory.get(key) || []).filter((t) => now - t < windowMs);
  if (prev.length >= ENQUEUE_LIMIT) {
    return {
      allowed: false,
      reason: `Rate limit: máximo ${ENQUEUE_LIMIT} enqueue_worker_job por minuto por sesión.`,
    };
  }
  prev.push(now);
  enqueueHistory.set(key, prev);
  return { allowed: true };
}

function tierForTool(toolName: string): "L0" | "L1" | "L2" | "L3" | null {
  if (MCP_TOOL_TIERS.L0.has(toolName)) return "L0";
  if (MCP_TOOL_TIERS.L1.has(toolName)) return "L1";
  if (MCP_TOOL_TIERS.L2.has(toolName)) return "L2";
  if (MCP_TOOL_TIERS.L3.has(toolName)) return "L3";
  return null;
}

/** Timeout de ejecución por tier de herramienta. */
export function getToolTimeoutMs(toolName: string): number {
  const tier = tierForTool(toolName);
  if (tier) return TIER_TIMEOUT_MS[tier];
  return TIER_TIMEOUT_MS.L1;
}
