#!/usr/bin/env node
/**
 * CLI: doctor Ollama (modelos routing_rules vs instalados).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runOllamaDoctor } from "./lib/ollama-doctor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sognaRoot = path.resolve(__dirname, "..");
const json = process.argv.includes("--json");

const result = await runOllamaDoctor(sognaRoot, { strict: true });

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(result.message);
  if (result.missing_models.length) {
    for (const hint of result.pull_hints) console.log(`  → ${hint}`);
  }
}

process.exit(result.ok ? 0 : 1);
