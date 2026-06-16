#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const sognaRoot = path.resolve(__dirname, "..");
export const cornersSsot = path.join(sognaRoot, "Curator", "corners");
export const ignoresSsot = path.join(cornersSsot, "ignores");

export function sha256(filePath) {
  const buf = readFileSync(filePath);
  // Normalizar CRLF→LF en texto para comparación cross-platform (CI windows-latest).
  if (buf.length > 0 && buf.length < 512_000 && !buf.includes(0)) {
    const text = buf.toString("utf8");
    if (!text.includes("\u0000")) {
      return createHash("sha256").update(text.replace(/\r\n/g, "\n"), "utf8").digest("hex");
    }
  }
  return createHash("sha256").update(buf).digest("hex");
}

export function copyVerify(src, dest) {
  if (!existsSync(src)) throw new Error(`Missing SSOT: ${src}`);
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  if (sha256(src) !== sha256(dest)) {
    throw new Error(`Hash mismatch: ${dest}`);
  }
}

export function hostRootFor(sogna) {
  return path.dirname(sogna);
}

export function isEmbeddedLayout(sogna) {
  const host = hostRootFor(sogna);
  return (
    host !== sogna &&
    existsSync(path.join(host, "Sogna", "platform.manifest.json"))
  );
}

const MOJIBAKE_MARKERS = [
  "\u00e2\u20ac",
  "\u00c3\u00a9",
  "\u00c3\u00ad",
  "\u00c3\u00b3",
  "Justificaci\u00c3\u00b3n",
];

export function detectMojibake(filePath) {
  if (!existsSync(filePath)) return false;
  const text = readFileSync(filePath, "utf8");
  return MOJIBAKE_MARKERS.some((m) => text.includes(m));
}

export function deployIgnores(root, layout, { includeGit = false } = {}) {
  const suffix = layout === "host" ? "host" : "monorepo";
  console.log(`  [ignores/${layout}] ${root}`);

  if (includeGit) {
    copyVerify(
      path.join(ignoresSsot, `gitignore.${suffix}`),
      path.join(root, ".gitignore"),
    );
    console.log("    OK  .gitignore");
    copyVerify(
      path.join(ignoresSsot, "gitattributes"),
      path.join(root, ".gitattributes"),
    );
    console.log("    OK  .gitattributes");
  }

  copyVerify(
    path.join(ignoresSsot, `rgignore.${suffix}`),
    path.join(root, ".rgignore"),
  );
  console.log("    OK  .rgignore");

  const aiSrc = path.join(ignoresSsot, `ai-index.${suffix}`);
  for (const name of [".cursorignore", ".claudeignore"]) {
    copyVerify(aiSrc, path.join(root, name));
    console.log(`    OK  ${name}`);
  }

  const staleAgIgnore = path.join(root, ".antigravityignore");
  if (existsSync(staleAgIgnore)) {
    rmSync(staleAgIgnore, { force: true });
    console.log(
      "    REMOVED stale .antigravityignore (Antigravity no lo carga; usar .agents/rules/sogna-index-exclusions.md)",
    );
  }
}

export function deployCorner(hostRoot, label) {
  console.log(`-- ${label} : ${hostRoot} --`);

  const cursorDest = path.join(hostRoot, ".cursor", "rules");
  const claudeDest = path.join(hostRoot, ".claude");
  const agDest = path.join(hostRoot, ".agents", "rules");

  mkdirSync(cursorDest, { recursive: true });
  mkdirSync(claudeDest, { recursive: true });
  mkdirSync(agDest, { recursive: true });

  const pairs = [
    [path.join(cornersSsot, "cursor", "sogna-bridge.mdc"), path.join(cursorDest, "sogna-bridge.mdc")],
    [path.join(cornersSsot, "cursor", "sogna-ecosystem.mdc"), path.join(cursorDest, "sogna-ecosystem.mdc")],
    [path.join(cornersSsot, "claude", "sogna-bridge.md"), path.join(claudeDest, "sogna-bridge.md")],
    [path.join(cornersSsot, "claude", "sogna-ecosystem.md"), path.join(claudeDest, "sogna-ecosystem.md")],
    [path.join(cornersSsot, "antigravity", "sogna-bridge.md"), path.join(agDest, "sogna-bridge.md")],
    [path.join(cornersSsot, "antigravity", "sogna-ecosystem.md"), path.join(agDest, "sogna-ecosystem.md")],
    [
      path.join(cornersSsot, "antigravity", "sogna-index-exclusions.md"),
      path.join(agDest, "sogna-index-exclusions.md"),
    ],
  ];

  for (const [src, dest] of pairs) {
    copyVerify(src, dest);
    console.log(`  OK  ${path.basename(dest)}`);
  }

  for (const stale of ["general-rules.md", "general-rules-r8.md"]) {
    const stalePath = path.join(agDest, stale);
    if (existsSync(stalePath)) {
      rmSync(stalePath, { force: true });
      console.log(`  REMOVED stale Capa 1: ${stale}`);
    }
  }

  if (label === "embedded-host") {
    const indexSsot = path.join(cornersSsot, "claude", "CLAUDE.index.host.md");
    const claudeIndex = path.join(hostRoot, "CLAUDE.md");
    copyVerify(indexSsot, claudeIndex);
    console.log("  OK  CLAUDE.md (index Capa 2)");
  }
}

export function assertSsotPresent() {
  const manifest = path.join(sognaRoot, "platform.manifest.json");
  if (!existsSync(manifest)) throw new Error(`Missing manifest: ${manifest}`);
  if (!statSync(cornersSsot).isDirectory()) {
    throw new Error(`Missing corners SSOT: ${cornersSsot}`);
  }
  if (!statSync(ignoresSsot).isDirectory()) {
    throw new Error(`Missing ignores SSOT: ${ignoresSsot}`);
  }
}
