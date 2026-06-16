#!/usr/bin/env node
/**
 * Catálogo de agentes institucionales (Curator/agents/*.md).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseSimpleYaml(block) {
  /** @type {Record<string, unknown>} */
  const out = {};
  let currentKey = null;
  let list = null;

  for (const line of block.split("\n")) {
    if (!line.trim()) continue;
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey && list) {
      list.push(listMatch[1].trim());
      continue;
    }
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === "") {
        list = [];
        out[currentKey] = list;
      } else {
        list = null;
        out[currentKey] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  return out;
}

/**
 * @param {string} sognaRoot
 */
export function listAgents(sognaRoot) {
  const agentsDir = path.join(sognaRoot, "Curator", "agents");
  if (!existsSync(agentsDir)) {
    return [];
  }

  return readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const full = path.join(agentsDir, file);
      const raw = readFileSync(full, "utf8");
      const fm = raw.match(FRONTMATTER_RE);
      const meta = fm ? parseSimpleYaml(fm[1]) : {};
      const body = fm ? raw.slice(fm[0].length).trim() : raw.trim();
      const id = String(meta.id || file.replace(/\.md$/, ""));
      return {
        id,
        name: String(meta.name || id),
        type: String(meta.type || "domain"),
        agent_group: String(meta.agent_group || "General"),
        task_types: Array.isArray(meta.task_types) ? meta.task_types : [],
        capabilities: Array.isArray(meta.capabilities) ? meta.capabilities : [],
        summary: body.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim() || "",
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * @param {string} sognaRoot
 * @param {string} agentId
 */
export function getAgentPlaybook(sognaRoot, agentId) {
  const agents = listAgents(sognaRoot);
  const normalized = agentId.toLowerCase().replace(/\.md$/, "");
  const found =
    agents.find((a) => a.id.toLowerCase() === normalized) ||
    agents.find((a) => a.id.toLowerCase().includes(normalized));

  if (!found) {
    return { error: `Agente no encontrado: ${agentId}`, available: agents.map((a) => a.id) };
  }

  const fullPath = path.join(sognaRoot, "Curator", "agents", `${found.id}.md`);
  const content = readFileSync(fullPath, "utf8");
  return { agent: found, playbook: content };
}
