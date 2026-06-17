#!/usr/bin/env node
/**
 * Resolución de modelos Ollama por task_type — SSOT para worker y MCP P5.
 */
import { loadIntelligenceConfig } from "./intelligence-config.mjs";
import { detectTaskType } from "./task-detect.mjs";
import { DEFAULT_OLLAMA_MODELS } from "./ollama-doctor.mjs";

/**
 * @param {string} sognaRoot
 * @param {string} taskText
 * @param {string} [modelOverride]
 * @returns {{ model: string; task_type: string; source: "override" | "routing_rules" | "default" }}
 */
export function resolveOllamaModel(sognaRoot, taskText, modelOverride) {
  const taskType = detectTaskType(taskText);
  if (modelOverride?.trim()) {
    return { model: modelOverride.trim(), task_type: taskType, source: "override" };
  }

  const cfg = loadIntelligenceConfig(sognaRoot);
  let model = DEFAULT_OLLAMA_MODELS[taskType] || DEFAULT_OLLAMA_MODELS.system;
  let source = "default";

  const rule = cfg.intelligence.routing_rules?.[taskType];
  if (typeof rule === "string" && rule.startsWith("ollama:")) {
    const name = rule.slice("ollama:".length).trim();
    if (name) {
      model = name;
      source = "routing_rules";
    }
  }

  return { model, task_type: taskType, source };
}

/**
 * @param {string} sognaRoot
 * @returns {{
 *   intelligence_mode: string;
 *   task_types: Array<{ task_type: string; model: string; rule: string | null; source: string }>;
 * }}
 */
export function getOllamaRoutingSnapshot(sognaRoot) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  const rules = cfg.intelligence.routing_rules || {};
  const taskTypes = Object.keys(DEFAULT_OLLAMA_MODELS);

  const rows = taskTypes.map((taskType) => {
    const rule = rules[taskType] ?? null;
    const resolved = resolveOllamaModel(sognaRoot, `tarea tipo ${taskType}`);
    return {
      task_type: taskType,
      model: resolved.model,
      rule: typeof rule === "string" ? rule : null,
      source: resolved.source,
    };
  });

  return {
    intelligence_mode: cfg.intelligence.mode,
    task_types: rows,
  };
}
