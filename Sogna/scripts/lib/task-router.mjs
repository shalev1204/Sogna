#!/usr/bin/env node
/**
 * Enrutamiento de tareas sin LLM — keywords + catálogo + DeptAgentRuntime (SSOT bridge).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { listAgents } from "./agent-catalog.mjs";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";
import { detectTaskType, tierForTaskType } from "./task-detect.mjs";
import {
  resolveDepartmentsForTask,
  buildDeptAgentProfile,
  buildDeptRuntimePackage,
  mapAgentGroupToDept,
} from "./dept-agent-bridge.mjs";

/** @type {Record<string, string[]>} */
const TASK_AGENT_MAP = {
  security: ["review-security", "ops-security", "penetration-tester", "security-auditor"],
  coding: ["eng-backend", "eng-frontend", "eng-api", "debugger"],
  testing: ["eng-qa", "test-engineer"],
  documentation: ["documentation-writer", "prod-techwriter"],
  architecture: ["architect", "orchestrator", "brain"],
  debugging: ["debugger", "code-archaeologist"],
  system: ["orchestrator", "supervisor", "ops-monitor"],
};

/**
 * @param {string} sognaRoot
 * @param {string} taskDescription
 * @param {object} [opts]
 * @param {string} [opts.agent_id]
 */
export function routeTask(sognaRoot, taskDescription, opts = {}) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const taskType = detectTaskType(taskDescription);
  const desc = taskDescription.toLowerCase();
  const agents = listAgents(sognaRoot);
  const deptInfo = resolveDepartmentsForTask(sognaRoot, taskDescription);
  const departments = deptInfo.departments;

  const candidateIds = TASK_AGENT_MAP[taskType] || TASK_AGENT_MAP.system;
  /** @type {typeof agents} */
  let matchedAgents = agents.filter((a) => candidateIds.includes(a.id));

  for (const agent of agents) {
    const caps = [...(agent.capabilities || []), ...(agent.task_types || [])]
      .join(" ")
      .toLowerCase();
    if (keywordsHit(desc, caps)) matchedAgents.push(agent);
    const agentDept = mapAgentGroupToDept(agent.agent_group || "", taskType);
    if (departments.includes(agentDept)) matchedAgents.push(agent);
  }

  const seen = new Set();
  matchedAgents = matchedAgents.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  if (matchedAgents.length === 0) {
    matchedAgents = agents.filter((a) => a.id === "orchestrator").slice(0, 1);
  }

  const tier = tierForTaskType(taskType);
  const routing = cfg.intelligence.routing_rules?.[taskType] ||
    cfg.intelligence.routing_rules?.[taskType === "debugging" ? "debugging" : "system"] ||
    "ollama:llama3.1:latest";

  let memoryHints = [];
  const graphPath = path.join(sognaRoot, "memory", "intelligence", "semantic", "graph.json");
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, "utf8"));
      const labels = (graph.nodes || [])
        .map((n) => String(n.label || n.id || "").toLowerCase())
        .filter((l) => l && desc.includes(l.split("/").pop() || l));
      memoryHints = labels.slice(0, 5);
    } catch {
      // ignore
    }
  }

  const primaryAgentId =
    opts.agent_id ||
    matchedAgents[0]?.id ||
    "orchestrator";

  const runtime = buildDeptRuntimePackage(sognaRoot, taskDescription, primaryAgentId);

  const recommended_agents = matchedAgents.slice(0, 6).map((a) => {
    const built = buildDeptAgentProfile(sognaRoot, a.id, taskType);
    return {
      id: a.id,
      name: a.name,
      agent_group: a.agent_group,
      task_types: a.task_types,
      dept_key: built.profile?.dept_key || mapAgentGroupToDept(a.agent_group || "", taskType),
      dept_runtime: built.profile || null,
    };
  });

  return {
    task_type: taskType,
    tier,
    departments,
    recommended_agents,
    primary_agent_id: primaryAgentId,
    dept_runtime: runtime.dept_runtime,
    model_route: runtime.model_route,
    recommended_profiles: runtime.recommended_profiles,
    worker_model_hint: routing,
    intelligence_mode: cfg.intelligence.mode,
    memory_hints: memoryHints,
    suggested_worker: runtime.worker_dispatch,
  };
}

export { detectTaskType, tierForTaskType };

/**
 * @param {string} desc
 * @param {string} blob
 */
function keywordsHit(desc, blob) {
  return blob
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .some((w) => desc.includes(w));
}
