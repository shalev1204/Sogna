#!/usr/bin/env node
/**
 * Inventario de agentes y skills (curated vs runtime).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { listAgents } from "./agent-catalog.mjs";

/**
 * @param {string} dir
 * @param {Set<string>} names
 */
function walkSkillFiles(dir, names) {
  if (!existsSync(dir)) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walkSkillFiles(full, names);
      continue;
    }
    if (!ent.isFile()) continue;
    const lower = ent.name.toLowerCase();
    if (lower === "skill.md" || lower === "skills.md") {
      names.add(full);
    }
  }
}

/**
 * @param {string} sognaRoot
 */
export function collectSkillsCatalog(sognaRoot) {
  const curatedDir = path.join(sognaRoot, "Curator", "skills");
  const runtimeDir = path.join(sognaRoot, "Sognatore", "resources", "skills");

  const curated = new Set();
  const runtime = new Set();
  walkSkillFiles(curatedDir, curated);
  walkSkillFiles(runtimeDir, runtime);

  const agents = listAgents(sognaRoot);

  return {
    agents: agents.length,
    skillsCurated: curated.size,
    skillsRuntime: runtime.size,
    skillsTotal: curated.size + runtime.size,
    curatedDir: existsSync(curatedDir),
    runtimeDir: existsSync(runtimeDir),
  };
}

/**
 * @param {ReturnType<typeof collectSkillsCatalog>} catalog
 */
export function formatCatalogSection(catalog) {
  return [
    " CATÁLOGO",
    `   Agentes:  ${catalog.agents} institucionales (Curator/agents)`,
    `   Skills:   ${catalog.skillsCurated} curated | ${catalog.skillsRuntime} runtime`,
  ];
}

/**
 * @param {string} sognaRoot
 */
export function needsPnpmInstall(sognaRoot) {
  const lockfile = path.join(sognaRoot, "pnpm-lock.yaml");
  const nodeModules = path.join(sognaRoot, "node_modules");
  if (!existsSync(lockfile)) return { needed: false, reason: "sin pnpm-lock.yaml" };
  if (!existsSync(nodeModules)) return { needed: true, reason: "node_modules ausente" };
  try {
    const lockMtime = statSync(lockfile).mtimeMs;
    const nmMtime = statSync(nodeModules).mtimeMs;
    if (lockMtime > nmMtime) return { needed: true, reason: "lockfile más reciente que node_modules" };
  } catch {
    return { needed: true, reason: "no se pudo comparar mtimes" };
  }
  return { needed: false, reason: "dependencias al día" };
}
