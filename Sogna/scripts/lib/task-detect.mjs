#!/usr/bin/env node
/**
 * Detección de tipo de tarea (SSOT compartido por task-router y dept-agent-bridge).
 */

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
 * @param {string} taskType
 */
export function tierForTaskType(taskType) {
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
