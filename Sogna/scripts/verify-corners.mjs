#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import {
  cornersSsot,
  detectMojibake,
  hostRootFor,
  ignoresSsot,
  isEmbeddedLayout,
  sha256,
  sognaRoot,
} from "./corners-lib.mjs";

const failures = [];

const expectedFiles = [
  { corner: ".cursor/rules", files: ["sogna-bridge.mdc", "sogna-ecosystem.mdc"] },
  { corner: ".claude", files: ["sogna-bridge.md", "sogna-ecosystem.md"] },
  {
    corner: ".agents/rules",
    files: ["sogna-bridge.md", "sogna-ecosystem.md", "sogna-index-exclusions.md"],
  },
];

const staleCapa1 = ["general-rules.md", "general-rules-r8.md"];

function ssotRelFor(group, file) {
  if (file === "sogna-bridge.mdc") return path.join("cursor", "sogna-bridge.mdc");
  if (file === "sogna-ecosystem.mdc") return path.join("cursor", "sogna-ecosystem.mdc");
  if (file === "sogna-bridge.md" && group === ".claude") {
    return path.join("claude", "sogna-bridge.md");
  }
  if (file === "sogna-ecosystem.md" && group === ".claude") {
    return path.join("claude", "sogna-ecosystem.md");
  }
  if (file === "sogna-index-exclusions.md") {
    return path.join("antigravity", "sogna-index-exclusions.md");
  }
  if (file === "sogna-bridge.md") return path.join("antigravity", "sogna-bridge.md");
  return path.join("antigravity", "sogna-ecosystem.md");
}

function testHashMatch(deployed, ssot, label) {
  if (!existsSync(deployed)) {
    failures.push(`${label} missing: ${deployed}`);
    console.log(`  FAIL  missing ${path.basename(deployed)}`);
    return false;
  }
  if (!existsSync(ssot)) {
    failures.push(`SSOT missing: ${ssot}`);
    console.log(`  FAIL  SSOT missing for ${path.basename(deployed)}`);
    return false;
  }
  if (sha256(deployed) !== sha256(ssot)) {
    failures.push(`${label} DRIFT: ${deployed}`);
    console.log(`  FAIL  DRIFT ${path.basename(deployed)}`);
    return false;
  }
  console.log(`  OK  ${path.basename(deployed)}`);
  return true;
}

function testIgnores(root, layout, { includeGit = false } = {}) {
  const suffix = layout === "host" ? "host" : "monorepo";
  console.log(`=== ignores/${layout} : ${root} ===`);

  if (includeGit) {
    testHashMatch(
      path.join(root, ".gitignore"),
      path.join(ignoresSsot, `gitignore.${suffix}`),
      `ignores/${layout}`,
    );
    testHashMatch(
      path.join(root, ".gitattributes"),
      path.join(ignoresSsot, "gitattributes"),
      `ignores/${layout}`,
    );
  }

  testHashMatch(
    path.join(root, ".rgignore"),
    path.join(ignoresSsot, `rgignore.${suffix}`),
    `ignores/${layout}`,
  );

  const aiSsot = path.join(ignoresSsot, `ai-index.${suffix}`);
  for (const name of [".cursorignore", ".claudeignore"]) {
    testHashMatch(path.join(root, name), aiSsot, `ignores/${layout}`);
  }

  const staleAgIgnore = path.join(root, ".antigravityignore");
  if (existsSync(staleAgIgnore)) {
    failures.push(
      `ignores/${layout} stale .antigravityignore: ${staleAgIgnore} (re-run deploy-corners)`,
    );
    console.log("  FAIL  stale .antigravityignore (Antigravity no lo carga)");
  }
  console.log("");
}

function testCornerEncoding(hostRoot, label) {
  console.log(`=== encoding/${label} : ${hostRoot} ===`);
  const paths = [
    path.join(hostRoot, ".cursor", "rules", "sogna-bridge.mdc"),
    path.join(hostRoot, ".cursor", "rules", "sogna-ecosystem.mdc"),
    path.join(hostRoot, ".claude", "sogna-bridge.md"),
    path.join(hostRoot, ".claude", "sogna-ecosystem.md"),
    path.join(hostRoot, ".agents", "rules", "sogna-bridge.md"),
    path.join(hostRoot, ".agents", "rules", "sogna-ecosystem.md"),
    path.join(hostRoot, ".gitignore"),
    path.join(hostRoot, ".gitattributes"),
    path.join(hostRoot, ".rgignore"),
    path.join(hostRoot, ".cursorignore"),
    path.join(hostRoot, ".claudeignore"),
    path.join(hostRoot, ".agents", "rules", "sogna-index-exclusions.md"),
  ];
  if (label === "embedded-host") paths.push(path.join(hostRoot, "CLAUDE.md"));

  for (const p of paths) {
    if (existsSync(p) && detectMojibake(p)) {
      failures.push(`encoding/${label} MOJIBAKE: ${p}`);
      console.log(`  FAIL  MOJIBAKE ${path.basename(p)}`);
    }
  }
  console.log("");
}

function testHostLayer2(hostRoot, label) {
  console.log(`=== corners/${label} : ${hostRoot} ===`);

  for (const group of expectedFiles) {
    const dir = path.join(hostRoot, group.corner);
    for (const file of group.files) {
      const p = path.join(dir, file);
      if (!existsSync(p)) {
        failures.push(`${label} missing: ${p}`);
        console.log(`  FAIL  ${group.corner}/${file}`);
        continue;
      }
      const ssotPath = path.join(cornersSsot, ssotRelFor(group.corner, file));
      if (existsSync(ssotPath) && sha256(p) !== sha256(ssotPath)) {
        failures.push(`${label} DRIFT: ${p} (re-run deploy-corners)`);
        console.log(`  FAIL  ${group.corner}/${file}  DRIFT vs SSOT`);
        continue;
      }
      console.log(`  OK  ${group.corner}/${file}`);
    }
  }

  for (const stale of staleCapa1) {
    const sp = path.join(hostRoot, ".agents", "rules", stale);
    if (existsSync(sp)) {
      failures.push(`${label} stale Capa 1: ${sp}`);
      console.log(`  FAIL  stale Capa 1: ${stale}`);
    }
  }

  if (label === "embedded-host") {
    testHashMatch(
      path.join(hostRoot, "CLAUDE.md"),
      path.join(cornersSsot, "claude", "CLAUDE.index.host.md"),
      `corners/${label}`,
    );
  }

  console.log("");
}

console.log("=== SSOT Curator/corners ===");
for (const check of [
  [path.join(sognaRoot, "platform.manifest.json"), "platform.manifest.json"],
  [path.join(cornersSsot, "cursor", "sogna-bridge.mdc"), "corners/cursor/sogna-bridge.mdc"],
  [path.join(cornersSsot, "cursor", "sogna-ecosystem.mdc"), "corners/cursor/sogna-ecosystem.mdc"],
  [path.join(cornersSsot, "claude", "sogna-bridge.md"), "corners/claude/sogna-bridge.md"],
  [path.join(cornersSsot, "claude", "sogna-ecosystem.md"), "corners/claude/sogna-ecosystem.md"],
  [path.join(cornersSsot, "claude", "CLAUDE.index.host.md"), "corners/claude/CLAUDE.index.host.md"],
  [path.join(cornersSsot, "antigravity", "sogna-bridge.md"), "corners/antigravity/sogna-bridge.md"],
  [path.join(cornersSsot, "antigravity", "sogna-ecosystem.md"), "corners/antigravity/sogna-ecosystem.md"],
  [
    path.join(cornersSsot, "antigravity", "sogna-index-exclusions.md"),
    "corners/antigravity/sogna-index-exclusions.md",
  ],
  [path.join(ignoresSsot, "gitignore.host"), "ignores/gitignore.host"],
  [path.join(ignoresSsot, "gitignore.monorepo"), "ignores/gitignore.monorepo"],
  [path.join(ignoresSsot, "gitattributes"), "ignores/gitattributes"],
  [path.join(ignoresSsot, "rgignore.host"), "ignores/rgignore.host"],
  [path.join(ignoresSsot, "rgignore.monorepo"), "ignores/rgignore.monorepo"],
  [path.join(ignoresSsot, "ai-index.host"), "ignores/ai-index.host"],
  [path.join(ignoresSsot, "ai-index.monorepo"), "ignores/ai-index.monorepo"],
]) {
  const [filePath, name] = check;
  if (!existsSync(filePath)) {
    failures.push(`SSOT missing: ${name}`);
    console.log(`FAIL  ${name}`);
  } else {
    console.log(`OK  ${name}`);
  }
}
console.log("");

const hostRoot = hostRootFor(sognaRoot);
const embedded = isEmbeddedLayout(sognaRoot);

if (embedded) {
  testIgnores(hostRoot, "host", { includeGit: true });
  testIgnores(sognaRoot, "monorepo");
} else {
  testIgnores(sognaRoot, "monorepo", { includeGit: true });
}

testHostLayer2(sognaRoot, "monorepo");
testCornerEncoding(sognaRoot, "monorepo");

if (embedded) {
  testHostLayer2(hostRoot, "embedded-host");
  testCornerEncoding(hostRoot, "embedded-host");
}

if (failures.length > 0) {
  console.log("RESULTADO: FAIL");
  for (const f of failures) console.log(`  - ${f}`);
  console.log("");
  console.log("Reparar: node Sogna/scripts/deploy-corners.mjs");
  process.exit(1);
}

console.log("RESULTADO: OK - Capa 2 corners + ignores completa");
