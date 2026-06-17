#!/usr/bin/env node
/**
 * Puente SSOT: catálogo Curator/agents ↔ DeptAgentRuntime (swarms dept/).
 * Consumido por task-router, worker kind=dept, dispatch-brief y DeptThinkService.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentPlaybook, listAgents } from "./agent-catalog.mjs";
import { detectTaskType } from "./task-detect.mjs";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";
import { DEFAULT_OLLAMA_MODELS } from "./ollama-doctor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, unknown> | null} */
let cachedMap = null;

export function loadDeptAgentMap() {
  if (cachedMap) return cachedMap;
  const raw = readFileSync(path.join(__dirname, "dept-agent-map.json"), "utf8");
  cachedMap = JSON.parse(raw);
  return cachedMap;
}

/**
 * @param {string} label
 */
export function normalizeDeptKey(label) {
  const map = loadDeptAgentMap();
  const normalized = String(label || "").toLowerCase();
  const keys = /** @type {string[]} */ (map.dept_keys || []);
  if (keys.includes(normalized)) return normalized;
  const aliases = /** @type {Record<string, string>} */ (map.dept_aliases || {});
  return aliases[normalized] || null;
}

/**
 * @param {string} deptKey
 */
export function deptKeyToClassName(deptKey) {
  const map = loadDeptAgentMap();
  const names = /** @type {Record<string, string>} */ (map.dept_class_names || {});
  return names[deptKey] || "OperationsDepartment";
}

/**
 * @param {string} departmentClass
 */
export function resolveInvokeTier(departmentClass) {
  const map = loadDeptAgentMap();
  const tiers = /** @type {Record<string, string>} */ (map.dept_tiers || {});
  return tiers[departmentClass] || tiers.default || "fast";
}

/**
 * @param {string} agentGroup
 * @param {string} [taskType]
 */
export function mapAgentGroupToDept(agentGroup, taskType) {
  const map = loadDeptAgentMap();
  const byGroup = /** @type {Record<string, string>} */ (map.agent_group_to_dept || {});
  const byTask = /** @type {Record<string, string>} */ (map.task_type_to_dept || {});

  if (agentGroup && byGroup[agentGroup]) return byGroup[agentGroup];
  if (taskType && byTask[taskType]) return byTask[taskType];
  return "operations";
}

/**
 * @param {string} sognaRoot
 * @param {string} taskDescription
 */
export function resolveDepartmentsForTask(sognaRoot, taskDescription) {
  const map = loadDeptAgentMap();
  const keywords = /** @type {Record<string, string[]>} */ (map.dept_keywords || {});
  const desc = taskDescription.toLowerCase();
  const taskType = detectTaskType(taskDescription);
  /** @type {Set<string>} */
  const departments = new Set();

  for (const [dept, words] of Object.entries(keywords)) {
    if (words.some((k) => desc.includes(k))) departments.add(dept);
  }

  const taskDept = mapAgentGroupToDept("", taskType);
  if (taskDept) departments.add(taskDept);

  if (departments.size === 0) departments.add("operations");

  return { departments: [...departments], taskType };
}

/**
 * @param {string} sognaRoot
 * @param {string} taskType
 */
export function resolveModelRoute(sognaRoot, taskType) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  let provider = "ollama";
  let model = DEFAULT_OLLAMA_MODELS[taskType] || DEFAULT_OLLAMA_MODELS.system;

  const rule = cfg.intelligence.routing_rules?.[taskType];
  if (typeof rule === "string" && rule.includes(":")) {
    const parts = rule.split(":");
    provider = parts[0] || "ollama";
    model = parts.slice(1).join(":") || model;
  }

  return {
    provider,
    model,
    task_type: taskType,
    intelligence_mode: cfg.intelligence.mode,
  };
}

/**
 * @param {{ id: string; name: string; agent_group?: string; capabilities?: string[]; task_types?: string[]; summary?: string }} agent
 * @param {string} taskType
 */
export function buildProfileFromAgent(agent, taskType) {
  const deptKey = mapAgentGroupToDept(agent.agent_group || "", taskType);
  const department = deptKeyToClassName(deptKey);
  const specialty =
    (agent.capabilities && agent.capabilities[0]) ||
    (agent.task_types && agent.task_types[0]) ||
    agent.summary ||
    agent.agent_group ||
    "General";

  return {
    id: agent.id,
    role: agent.name,
    specialty: String(specialty),
    department,
    dept_key: deptKey,
    invoke_tier: resolveInvokeTier(department),
  };
}

/**
 * @param {{ task_types?: string[]; capabilities?: string[]; id?: string }} agent
 * @param {string} task
 */
export function inferTaskTypeForAgent(agent, task) {
  const fromTask = detectTaskType(task);
  if (fromTask !== "system") return fromTask;

  const blob = [...(agent.task_types || []), ...(agent.capabilities || []), agent.id || ""]
    .join(" ")
    .toLowerCase();

  if (blob.includes("security") || blob.includes("audit") || blob.includes("pentest"))
    return "security";
  if (blob.includes("test") || blob.includes("qa")) return "testing";
  if (blob.includes("document")) return "documentation";
  if (blob.includes("architect")) return "architecture";
  if (blob.includes("debug")) return "debugging";
  if (blob.includes("backend") || blob.includes("frontend") || blob.includes("code"))
    return "coding";

  return fromTask;
}

/**
 * @param {string} sognaRoot
 * @param {string} agentId
 * @param {string} [taskType]
 */
export function buildDeptAgentProfile(sognaRoot, agentId, taskType = "system") {
  const pb = getAgentPlaybook(sognaRoot, agentId);
  if (pb.error || !pb.agent) {
    return {
      error: pb.error || `Agente no encontrado: ${agentId}`,
      available: pb.available || [],
    };
  }

  const resolvedTaskType = taskType || inferTaskTypeForAgent(pb.agent, "") || "system";
  const profile = buildProfileFromAgent(pb.agent, resolvedTaskType);
  const modelRoute = resolveModelRoute(sognaRoot, resolvedTaskType);

  return {
    profile,
    model_route: modelRoute,
    agent: pb.agent,
    task_type: resolvedTaskType,
  };
}

/**
 * @param {string} sognaRoot
 * @param {string} agentId
 * @param {string} task
 */
export function buildDeptAgentProfileForTask(sognaRoot, agentId, task) {
  const pb = getAgentPlaybook(sognaRoot, agentId);
  if (pb.error || !pb.agent) {
    return {
      error: pb.error || `Agente no encontrado: ${agentId}`,
      available: pb.available || [],
    };
  }
  const resolvedTaskType = inferTaskTypeForAgent(pb.agent, task);
  return buildDeptAgentProfile(sognaRoot, agentId, resolvedTaskType);
}

/**
 * Mismo encabezado que DeptAgentRuntime.think (TS).
 * @param {{ id: string; role: string; specialty: string; department: string }} profile
 */
export function buildDeptSystemPrompt(profile) {
  return [
    `# SOGNA DEPT AGENT: ${profile.id}`,
    `Department: ${profile.department}`,
    `Role: ${profile.role}`,
    `Specialty: ${profile.specialty}`,
    "Respond concisely. If the task is operational, provide actionable output.",
  ].join("\n");
}

/**
 * @param {string} sognaRoot
 * @param {string} taskDescription
 * @param {string} [preferredAgentId]
 */
export function buildDeptRuntimePackage(sognaRoot, taskDescription, preferredAgentId) {
  const { departments, taskType } = resolveDepartmentsForTask(sognaRoot, taskDescription);
  const agents = listAgents(sognaRoot);

  const candidateIds = preferredAgentId ? [preferredAgentId] : [];
  if (!candidateIds.length) {
    const routeAgents = agents.filter((a) => {
      const deptKey = mapAgentGroupToDept(a.agent_group || "", taskType);
      return departments.includes(deptKey);
    });
    candidateIds.push(...routeAgents.slice(0, 6).map((a) => a.id));
  }

  if (!candidateIds.length) {
    const orch = agents.find((a) => a.id === "orchestrator");
    if (orch) candidateIds.push(orch.id);
  }

  const primaryId = candidateIds[0];
  const primary = primaryId ? buildDeptAgentProfile(sognaRoot, primaryId, taskType) : null;

  const profiles = candidateIds
    .map((id) => buildDeptAgentProfile(sognaRoot, id, taskType))
    .filter((p) => !p.error && p.profile);

  return {
    task_type: taskType,
    departments,
    primary_agent_id: primaryId || null,
    dept_runtime: primary?.profile || null,
    model_route: primary?.model_route || resolveModelRoute(sognaRoot, taskType),
    recommended_profiles: profiles.map((p) => ({
      agent_id: p.profile.id,
      profile: p.profile,
      model_route: p.model_route,
    })),
    worker_dispatch: primaryId
      ? { kind: "dept", agent_id: primaryId, task: taskDescription }
      : { kind: "ollama", task: taskDescription },
  };
}
