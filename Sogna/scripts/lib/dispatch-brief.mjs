#!/usr/bin/env node
/**
 * Genera brief de delegación para IDE / CLI / UI.
 */
import { getAgentPlaybook, listAgents } from "./agent-catalog.mjs";
import { routeTask } from "./task-router.mjs";
import { getProjectContext } from "./project-context.mjs";

/**
 * @param {string} sognaRoot
 * @param {object} opts
 * @param {string} [opts.task]
 * @param {string} [opts.agentId]
 * @param {string} [opts.query]
 * @param {string} [opts.umaRecall]
 */
export function buildDispatchBrief(sognaRoot, opts = {}) {
  const lines = [];
  const ctx = getProjectContext(sognaRoot);

  lines.push("# SOGNA — Brief de delegación");
  lines.push("");
  lines.push(`Modo inteligencia: ${ctx.intelligence_mode} | keyless: ${ctx.keyless}`);
  lines.push("");

  if (opts.task) {
    const route = routeTask(sognaRoot, opts.task);
    lines.push("## Enrutamiento");
    lines.push(`- Tipo: ${route.task_type}`);
    lines.push(`- Departamentos: ${route.departments.join(", ")}`);
    lines.push(
      `- Agentes recomendados: ${route.recommended_agents.map((a) => a.id).join(", ")}`,
    );
    lines.push(`- Worker sugerido: ${JSON.stringify(route.suggested_worker)}`);
    lines.push("");
  }

  const agentId =
    opts.agentId ||
    (opts.task ? routeTask(sognaRoot, opts.task).recommended_agents[0]?.id : null);

  if (agentId) {
    const pb = getAgentPlaybook(sognaRoot, agentId);
    if (!pb.error && pb.playbook) {
      lines.push(`## Playbook: ${agentId}`);
      lines.push("");
      lines.push(pb.playbook.slice(0, 12000));
      lines.push("");
    }
  }

  if (opts.umaRecall) {
    lines.push("## Recall UMA");
    lines.push("");
    lines.push(opts.umaRecall.slice(0, 8000));
    lines.push("");
  }

  if (opts.query && !opts.umaRecall) {
    lines.push("## Consulta");
    lines.push(opts.query);
    lines.push("");
  }

  lines.push("## Contexto proyecto (resumen)");
  lines.push(JSON.stringify(ctx, null, 2).slice(0, 4000));

  return {
    brief: lines.join("\n"),
    agent_id: agentId,
    context: ctx,
    agents_available: listAgents(sognaRoot).length,
  };
}
