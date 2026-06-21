#!/usr/bin/env node
/**
 * Reorganiza .env según .env.example. Conserva valores. No muestra secretos.
 * Uso: node scripts/env-organize.mjs [--dry-run]
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");
const examplePath = path.join(sognaRoot, ".env.example");
const envPath = path.join(sognaRoot, ".env");
const dryRun = process.argv.includes("--dry-run");

const KEY_RE = /^([A-Z][A-Z0-9_]*)\s*=/;

function parseKeyValues(filePath) {
  const map = new Map();
  if (!existsSync(filePath)) return map;
  for (const raw of readFileSync(filePath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(KEY_RE);
    if (!m) continue;
    map.set(m[1], line.slice(m[0].length).trim());
  }
  return map;
}

function parseExampleStructure(examplePath) {
  const structure = [];
  if (!existsSync(examplePath)) return structure;
  for (const raw of readFileSync(examplePath, "utf8").split("\n")) {
    const trimmed = raw.trimEnd();
    if (trimmed.startsWith("#") || trimmed === "") {
      structure.push({ type: "comment", text: trimmed });
      continue;
    }
    const m = trimmed.match(KEY_RE);
    if (m) {
      structure.push({
        type: "key",
        key: m[1],
        defaultValue: trimmed.slice(m[0].length).trim(),
      });
    }
  }
  return structure;
}

function buildOrganizedEnv(structure, existing, extraKeys) {
  const used = new Set();
  const lines = [
    "# SOGNA .env",
    "# Reorganizado por pnpm env:organize. No commitear.",
    "",
  ];

  for (const item of structure) {
    if (item.type === "comment") {
      lines.push(item.text);
      continue;
    }
    if (item.type === "key" && item.key) {
      used.add(item.key);
      const value = existing.has(item.key) ? existing.get(item.key) : (item.defaultValue ?? "");
      lines.push(`${item.key}=${value}`);
    }
  }

  const leftovers = [...extraKeys].filter((k) => !used.has(k)).sort();
  if (leftovers.length) {
    lines.push("", "# 4. EXTRA (no listadas en plantilla)", "");
    for (const key of leftovers) {
      lines.push(`${key}=${existing.get(key) ?? ""}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function main() {
  if (!existsSync(examplePath)) {
    console.error("[env-organize] Falta .env.example");
    process.exit(1);
  }

  const structure = parseExampleStructure(examplePath);
  const existing = parseKeyValues(envPath);
  const exampleKeys = new Set(
    structure.filter((s) => s.type === "key").map((s) => s.key),
  );
  const extraKeys = [...existing.keys()].filter((k) => !exampleKeys.has(k));

  if (!existsSync(envPath)) {
    if (!dryRun) copyFileSync(examplePath, envPath);
    console.log("[env-organize] .env creado desde plantilla.");
    return;
  }

  const otelOk =
    String(existing.get("OTEL_EXPORTER_OTLP_ENDPOINT") || "").trim() &&
    String(existing.get("OTEL_EXPORTER_OTLP_HEADERS") || "").trim();

  if (dryRun) {
    console.log(`[env-organize] ${existing.size} claves | Grafana: ${otelOk ? "ok" : "pendiente"}`);
    return;
  }

  copyFileSync(envPath, `${envPath}.bak`);
  writeFileSync(envPath, buildOrganizedEnv(structure, existing, extraKeys), "utf8");
  console.log(`[env-organize] Listo (${existing.size} claves). Backup: .env.bak`);
}

main();
