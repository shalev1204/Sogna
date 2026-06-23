#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Capa1 = path.resolve(__dirname, "..");
const skillsSrc = path.join(Capa1, "SKILLS");
const workflowsSrc = path.join(Capa1, "WORKFLOWS");
const reglasSrc = path.join(Capa1, "REGLAS");

console.log("==========================================");
console.log("  CAPA 1 — Instalación desde Sogna/Capa 1");
console.log("==========================================");
console.log(`Origen: ${Capa1}`);
console.log("");

const home = os.homedir();

// Helper para copiar y forzar creación de directorio padre
function copyItem(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Archivo origen ausente: ${src}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// 1. --- REGLAS ---
console.log("=== REGLAS ===");
const gemini1 = path.join(reglasSrc, "general-rules.md");
const geminiR8 = path.join(reglasSrc, "general-rules-r8.md");
const claudeCapa1 = path.join(reglasSrc, "claude", "CLAUDE-CAPA1.md");

copyItem(gemini1, path.join(home, ".gemini", "GEMINI.md"));
copyItem(geminiR8, path.join(home, ".gemini", "GEMINI-R8.md"));
console.log("OK  ~/.gemini/GEMINI.md + GEMINI-R8.md");

if (fs.existsSync(claudeCapa1)) {
  copyItem(claudeCapa1, path.join(home, ".claude", "CLAUDE.md"));
  console.log("OK  ~/.claude/CLAUDE.md (Capa 1 compacta)");
} else {
  console.log("WARN  Falta REGLAS/claude/CLAUDE-CAPA1.md");
}
console.log("");

// 2. --- SKILLS ---
console.log("=== SKILLS (13) ===");
const skillTargets = [
  path.join(home, ".cursor", "skills"),
  path.join(home, ".claude", "skills"),
  path.join(home, ".agents", "skills"),
  path.join(home, ".gemini", "config", "skills"),
  path.join(home, ".gemini", "antigravity", "skills"),
];

for (const t of skillTargets) {
  fs.mkdirSync(t, { recursive: true });
}

const skillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .filter(dirent => fs.existsSync(path.join(skillsSrc, dirent.name, "SKILL.md")));

for (const skill of skillDirs) {
  const name = skill.name;
  const src = path.join(skillsSrc, name, "SKILL.md");
  for (const t of skillTargets) {
    const destFile = path.join(t, name, "SKILL.md");
    copyItem(src, destFile);
  }
  console.log(`OK  skill ${name}`);
}
console.log(`Total: ${skillDirs.length} skills`);
console.log("");

// 3. --- WORKFLOWS ---
console.log("=== WORKFLOWS (6) ===");
const wfFiles = ["implement.md", "fix-bug.md", "review.md", "explore.md", "refactor.md", "ship.md"];
const agMeta = {
  "implement.md": "Implementa feature con plan, gate OK del Operador y verify. /implement. Orquesta plan-before-build.",
  "fix-bug.md": "Corrige bug con reproduccion, causa raiz y regresion. /fix-bug. Orquesta systematic-debug.",
  "review.md": "Revision pre-merge con veredicto APPROVE o REQUEST CHANGES. /review. Orquesta code-review.",
  "explore.md": "Explora repo desconocido y entrega mapa operativo. /explore. Solo lectura.",
  "refactor.md": "Refactor seguro sin cambiar comportamiento. /refactor. Orquesta safe-refactor.",
  "ship.md": "Verify, commit y PR bajo mandato. /ship. Orquesta commit-prepare y git-workflow.",
};

const plainWf = [
  path.join(home, ".cursor", "commands"),
  path.join(home, ".claude", "commands"),
];
const agIdeWf = path.join(home, ".gemini", "antigravity-ide", "global_workflows");
const agGlobalWf = path.join(home, ".gemini", "antigravity", "global_workflows");
const agConfigWf = path.join(home, ".gemini", "config", "workflows");

const allWfDirs = [...plainWf, agIdeWf, agGlobalWf, agConfigWf];
for (const d of allWfDirs) {
  fs.mkdirSync(d, { recursive: true });
}

for (const f of wfFiles) {
  const src = path.join(workflowsSrc, f);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing workflow: ${src}`);
  }
  const body = fs.readFileSync(src, "utf8");

  // Copia normal a Cursor/Claude
  for (const t of plainWf) {
    fs.writeFileSync(path.join(t, f), body, "utf8");
  }

  // Copia con metadatos para Antigravity
  const agContent = `---\ndescription: "${agMeta[f]}"\n---\n${body}`;
  for (const agDir of [agIdeWf, agGlobalWf, agConfigWf]) {
    fs.writeFileSync(path.join(agDir, f), agContent, "utf8");
  }
  console.log(`OK  workflow ${f}  /${f.replace(/\.md$/, "")}`);
}

console.log("");
console.log("==========================================");
console.log("  INSTALACIÓN COMPLETA");
console.log("==========================================");
console.log("Verificar: node \"Capa 1/scripts/verificar-capa1.mjs\"");
console.log("Cursor: pegar User Rules manualmente (ver README)");
console.log("");
