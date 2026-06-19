#!/usr/bin/env node
/**
 * Carga Sogna/.env en process.env (sin sobrescribir claves ya definidas).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * @param {string} sognaRoot
 */
export function loadSognaDotenv(sognaRoot) {
  const envPath = path.join(sognaRoot, ".env");
  if (!existsSync(envPath)) return { loaded: false, path: envPath };

  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return { loaded: true, path: envPath };
}
