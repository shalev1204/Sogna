#!/usr/bin/env node
/**
 * Enrutamiento de tareas sin LLM — keywords + catálogo de agentes.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { listAgents } from "./agent-catalog.mjs";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";

/** @type {Record<string, string[]>} */
const DEPT_KEYWORDS = {
  protection: ["security", "seguridad", "audit", "sentinel", "veto", "pentest", "threat"],
  infrastructure: ["backend", "database", "devops", "infra", "deploy", "docker", "api"],
  operations: ["monitor", "incident", "sre", "compliance", "release", "ops"],
  studio: ["design", "ui", "ux", "frontend", "style", "visual"],
  marketing: ["marketing", "growth", "content", "seo", "viral"],
  finance: ["finance", "billing", "cost", "budget"],
  legal: ["legal", "contract", "gdpr", "privacy", "compliance"],
  sales: ["sales", "crm", "lead"],
  crm: ["customer", "loyalty", "crm"],
};

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
 * @param {string} objective
 */
export function detectTaskType(objective) {
  const obj = objective.toLowerCase();
  if (obj.includes("test") || obj.includes("qa")) return "testing";
  if (obj.includes("fix") || obj.includes("debug")) return "debugging";
  if (obj.includes("security") || obj.includes("audit") || obj.includes("sentinel"))
    return "security";
  if (obj.includes("document") || obj.includes("readme")) return "documentation";
  if (obj.includes("architect") || obj.includes("design system")) return "architecture";
  if (
    obj.includes("implement") ||
    obj.includes("refactor") ||
    obj.includes("build") ||
    obj.includes("code")
  )
    return "coding";
  return "system";
}

/**
 * @param {string} sognaRoot
 * @param {string} taskDescription
 */
export function routeTask(sognaRoot, taskDescription) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const taskType = detectTaskType(taskDescription);
  const desc = taskDescription.toLowerCase();
  const agents = listAgents(sognaRoot);

  /** @type {Set<string>} */
  const departments = new Set();
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    if (keywords.some((k) => desc.includes(k))) departments.add(dept);
  }
  if (taskType === "security") departments.add("protection");
  if (taskType === "coding" || taskType === "debugging") departments.add("infrastructure");
  if (departments.size === 0) departments.add("operations");

  const candidateIds = TASK_AGENT_MAP[taskType] || TASK_AGENT_MAP.system;
  /** @type {typeof agents} */
  let matchedAgents = agents.filter((a) => candidateIds.includes(a.id));

  for (const agent of agents) {
    const caps = [...(agent.capabilities || []), ...(agent.task_types || [])]
      .join(" ")
      .toLowerCase();
    if (keywordsHit(desc, caps)) matchedAgents.push(agent);
  }

  // Dedupe
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

  return {
    task_type: taskType,
    tier,
    departments: [...departments],
    recommended_agents: matchedAgents.slice(0, 6).map((a) => ({
      id: a.id,
      name: a.name,
      agent_group: a.agent_group,
      task_types: a.task_types,
    })),
    worker_model_hint: routing,
    intelligence_mode: cfg.intelligence.mode,
    memory_hints: memoryHints,
    suggested_worker:
      taskType === "security"
        ? { kind: "script", action: "sentinel-audit" }
        : tier === "T3"
          ? { kind: "script", action: "sognatore-doctor" }
          : { kind: "ollama", tier, task: taskDescription },
  };
}

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

/**
 * @param {string} taskType
 */
function tierForTaskType(taskType) {
  switch (taskType) {
    case "security":
    case "testing":
      return "T3";
    case "documentation":
    case "architecture":
      return "T5";
    case "debugging":
    case "coding":
      return "T4";
    default:
      return "T4";
  }
}
