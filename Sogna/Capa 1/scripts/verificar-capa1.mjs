#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Capa1 = path.resolve(__dirname, "..");
const home = os.homedir();

const skillNames = [
  "plan-before-build", "systematic-debug", "code-review", "safe-refactor",
  "api-contract-design", "meaningful-tests", "technical-docs", "git-workflow",
  "pragmatic-performance", "secure-by-default", "explore-codebase", "commit-prepare", "find-skills"
];

const workflowFiles = ["implement.md", "fix-bug.md", "review.md", "explore.md", "refactor.md", "ship.md"];
const failures = [];

const MOJIBAKE_MARKERS = [
  "\u00e2\u20ac",
  "\u00c3\u00a9",
  "\u00c3\u00ad",
  "\u00c3\u00b3",
  "Justificaci\u00c3\u00b3n",
];

function checkMojibake(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  if (MOJIBAKE_MARKERS.some(m => text.includes(m))) {
    failures.push(`MOJIBAKE en archivo: ${filePath}`);
    console.log(`FAIL  MOJIBAKE en ${path.basename(filePath)}`);
  }
}

console.log("=== REGLAS ===");
const rulesToCheck = [
  { name: "GEMINI.md", path: path.join(home, ".gemini", "GEMINI.md") },
  { name: "GEMINI-R8.md", path: path.join(home, ".gemini", "GEMINI-R8.md") },
  { name: "CLAUDE.md", path: path.join(home, ".claude", "CLAUDE.md") }
];

for (const rule of rulesToCheck) {
  if (fs.existsSync(rule.path)) {
    console.log(`OK  ${rule.name}`);
    checkMojibake(rule.path);
  } else {
    failures.push(`Falta regla global: ${rule.name} (en ${rule.path})`);
    console.log(`FAIL  ${rule.name}`);
  }
}

console.log("");
console.log("=== SKILLS (13) ===");
for (const name of skillNames) {
  const p = path.join(home, ".cursor", "skills", name, "SKILL.md");
  if (fs.existsSync(p)) {
    console.log(`OK  skill ${name}`);
    checkMojibake(p);
  } else {
    failures.push(`Falta skill global: ${name} (en ${p})`);
    console.log(`FAIL  skill ${name}`);
  }
}

console.log("");
console.log("=== WORKFLOWS (6) ===");
for (const f of workflowFiles) {
  const p = path.join(home, ".cursor", "commands", f);
  if (fs.existsSync(p)) {
    console.log(`OK  workflow ${f}`);
    checkMojibake(p);
  } else {
    failures.push(`Falta workflow global: ${f} (en ${p})`);
    console.log(`FAIL  workflow ${f}`);
  }
}

console.log("");
console.log("=== SSOT en repo (Capa 1/) ===");
const repoChecks = [
  "REGLAS/general-rules.md",
  "REGLAS/general-rules-r8.md",
  "SKILLS/plan-before-build/SKILL.md",
  "WORKFLOWS/implement.md"
];

for (const rc of repoChecks) {
  const p = path.join(Capa1, rc);
  if (fs.existsSync(p)) {
    console.log(`OK  repo ${rc}`);
    checkMojibake(p);
  } else {
    failures.push(`Falta SSOT en repo: ${rc}`);
    console.log(`FAIL  repo ${rc}`);
  }
}

console.log("");
if (failures.length > 0) {
  console.error("RESULTADO: FAIL");
  for (const f of failures) {
    console.error(`  - ${f}`);
  }
  console.error("");
  console.error("Reparar: node \"Capa 1/scripts/instalar-capa1-completa.mjs\"");
  process.exit(1);
}

console.log("RESULTADO: OK — Capa 1 instalada (Cursor User Rules: confirmar manualmente)");
process.exit(0);
