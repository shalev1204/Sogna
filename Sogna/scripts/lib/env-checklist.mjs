#!/usr/bin/env node
/**
 * Checklist de .env vs .env.example — nunca expone valores.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { hasCloudApiKeys, loadIntelligenceConfig } from "./intelligence-config.mjs";

const VAR_RE = /^#?\s*@?(required|optional|recommended)\s+([A-Z][A-Z0-9_]*)\s*$/i;
const KEY_RE = /^([A-Z][A-Z0-9_]*)\s*=/;

/**
 * @param {string} examplePath
 */
export function parseEnvExample(examplePath) {
  /** @type {{ name: string; tier: 'required'|'optional'|'recommended' }[]} */
  const vars = [];
  if (!existsSync(examplePath)) {
    return { vars, missingFile: true };
  }

  let currentTier = "optional";
  for (const line of readFileSync(examplePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("# ===")) continue;

    const tierVarMatch = trimmed.match(
      /^#\s*@?(required|optional|recommended)\s+([A-Z][A-Z0-9_]*)\s*$/i,
    );
    if (tierVarMatch) {
      vars.push({
        name: tierVarMatch[2],
        tier: /** @type {'required'|'optional'|'recommended'} */ (tierVarMatch[1].toLowerCase()),
      });
      continue;
    }

    const tierMatch = trimmed.match(/^#\s*@?(required|optional|recommended)\b/i);
    if (tierMatch) {
      currentTier = tierMatch[1].toLowerCase();
      continue;
    }

    const annotated = trimmed.match(VAR_RE);
    if (annotated) {
      vars.push({ name: annotated[2], tier: /** @type {'required'|'optional'|'recommended'} */ (annotated[1].toLowerCase()) });
      continue;
    }

    const keyMatch = trimmed.match(KEY_RE);
    if (keyMatch && !trimmed.startsWith("#")) {
      vars.push({ name: keyMatch[1], tier: currentTier });
    }
  }

  const seen = new Set();
  const deduped = vars.filter((v) => {
    if (seen.has(v.name)) return false;
    seen.add(v.name);
    return true;
  });

  return { vars: deduped, missingFile: false };
}

/**
 * @param {string} envPath
 */
export function parseEnvKeys(envPath) {
  if (!existsSync(envPath)) return new Set();
  const keys = new Set();
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(KEY_RE);
    if (m) keys.add(m[1]);
  }
  return keys;
}

/**
 * @param {string} sognaRoot
 */
export function checkEnv(sognaRoot) {
  const examplePath = path.join(sognaRoot, ".env.example");
  const envPath = path.join(sognaRoot, ".env");
  const { vars, missingFile } = parseEnvExample(examplePath);
  const present = parseEnvKeys(envPath);
  const cfg = loadIntelligenceConfig(sognaRoot);
  const cloudMode = cfg.intelligence.mode === "cloud" || cfg.intelligence.mode === "hybrid";
  const needsCloudKeys = cloudMode && !cfg.keyless;

  const required = vars.filter((v) => v.tier === "required");
  const recommended = vars.filter((v) => v.tier === "recommended");
  const optional = vars.filter((v) => v.tier === "optional");

  const missingRequired = needsCloudKeys
    ? required.filter((v) => !present.has(v.name)).map((v) => v.name)
    : [];
  const missingRecommended = recommended.filter((v) => !present.has(v.name)).map((v) => v.name);

  let cloudKeysOk = true;
  if (needsCloudKeys && !hasCloudApiKeys()) {
    cloudKeysOk = false;
  }

  const envExists = existsSync(envPath);
  const documented = vars.length;
  const setCount = vars.filter((v) => present.has(v.name)).length;

  return {
    envExists,
    exampleExists: !missingFile,
    documented,
    setCount,
    required: required.map((v) => v.name),
    missingRequired,
    missingRecommended,
    optionalCount: optional.length,
    cloudMode,
    needsCloudKeys,
    cloudKeysOk,
    blocking: missingRequired.length > 0 || (needsCloudKeys && !cloudKeysOk && missingRequired.length > 0),
  };
}

/**
 * @param {ReturnType<typeof checkEnv>} report
 */
export function formatEnvSection(report) {
  const lines = [];
  lines.push(" ENV");
  if (!report.exampleExists) {
    lines.push("   Plantilla: ✗ .env.example no encontrado");
    return lines;
  }
  if (!report.envExists) {
    lines.push("   Archivo:   ⚠ .env ausente (copie desde .env.example)");
    lines.push(`   Plantilla: ${report.documented} variable(s) documentada(s)`);
    return lines;
  }
  lines.push(`   Archivo:   ✓ .env presente — ${report.setCount}/${report.documented} claves documentadas`);
  if (report.needsCloudKeys) {
    if (report.missingRequired.length) {
      lines.push(`   Requeridas: ✗ faltan ${report.missingRequired.join(", ")}`);
    } else if (report.required.length) {
      lines.push(`   Requeridas: ✓ ${report.required.length}/${report.required.length}`);
    }
  }
  if (report.missingRecommended.length) {
    lines.push(`   Recomend.:  ⚠ faltan ${report.missingRecommended.join(", ")}`);
  }
  if (report.needsCloudKeys && !report.cloudKeysOk) {
    lines.push("   Cloud:     ⚠ modo hybrid/cloud sin API keys detectadas");
  } else if (report.cloudMode) {
    lines.push("   Cloud:     ✓ keys o modo compatible");
  } else {
    lines.push("   Modo:      local (sin claves cloud obligatorias)");
  }
  return lines;
}
