#!/usr/bin/env node
/**
 * Contexto de proyecto empaquetado para agentes IDE (sin LLM).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { loadIntelligenceConfig } from "./intelligence-config.mjs";

/**
 * @param {string} sognaRoot
 */
export function getProjectContext(sognaRoot) {
  const cfg = loadIntelligenceConfig(sognaRoot);
  /** @type {Record<string, unknown>} */
  const ctx = {
    sogna_root: sognaRoot,
    intelligence_mode: cfg.intelligence.mode,
    keyless: cfg.keyless,
    local_mode: cfg.localMode,
    identity_excerpt: null,
    swarm_mission: null,
    graph_summary: null,
    recent_episodic: null,
  };

  const identityPath = path.join(sognaRoot, "memory", "identity", "sogna.md");
  if (existsSync(identityPath)) {
    const text = readFileSync(identityPath, "utf8");
    ctx.identity_excerpt = text.slice(0, 2500);
  }

  const swarmPath = path.join(sognaRoot, "memory", "operational", "agent", "active_state.json");
  if (existsSync(swarmPath)) {
    try {
      ctx.swarm_mission = JSON.parse(readFileSync(swarmPath, "utf8"));
    } catch {
      ctx.swarm_mission = { error: "active_state.json invalid" };
    }
  }

  const graphPath = path.join(sognaRoot, "memory", "intelligence", "semantic", "graph.json");
  if (existsSync(graphPath)) {
    try {
      const graph = JSON.parse(readFileSync(graphPath, "utf8"));
      const meta = graph.meta || {};
      ctx.graph_summary = {
        version: meta.version,
        node_count: meta.node_count ?? (graph.nodes || []).length,
        edge_count: meta.edge_count ?? (graph.edges || []).length,
        last_validated: meta.last_validated,
      };
    } catch {
      ctx.graph_summary = { error: "graph parse failed" };
    }
  }

  const episodicDir = path.join(sognaRoot, "memory", "intelligence", "episodic");
  if (existsSync(episodicDir)) {
    try {
      const snaps = readdirSync(episodicDir)
        .filter((f) => f.startsWith("snapshot_") && f.endsWith(".json"))
        .sort()
        .slice(-1);
      if (snaps[0]) {
        const snap = JSON.parse(readFileSync(path.join(episodicDir, snaps[0]), "utf8"));
        ctx.recent_episodic = {
          file: snaps[0],
          timestamp: snap.timestamp || snap.created_at || null,
          summary:
            typeof snap.summary === "string" ? snap.summary.slice(0, 1500) : snap,
        };
      }
    } catch {
      // ignore
    }
  }

  return ctx;
}
