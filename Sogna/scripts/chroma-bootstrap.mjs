#!/usr/bin/env node
/**
 * Bootstrap ChromaDB local (primera vez o --force).
 *   node scripts/chroma-bootstrap.mjs
 *   node scripts/chroma-bootstrap.mjs --force
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sognaRoot } from "./corners-lib.mjs";
import { ensureChromaBootstrap } from "./lib/chroma-bootstrap.mjs";

const force = process.argv.includes("--force");

const result = ensureChromaBootstrap(sognaRoot, { force });
console.log(`[chroma] ${result.action}: ${result.detail}`);
console.log(`[chroma] dir: ${result.chromaDir}`);
process.exit(result.ok ? 0 : 1);
