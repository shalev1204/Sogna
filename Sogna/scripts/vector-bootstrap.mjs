#!/usr/bin/env node
/**
 * Bootstrap índice vectorial UMA.
 *   node scripts/vector-bootstrap.mjs
 *   node scripts/vector-bootstrap.mjs --force
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sognaRoot } from "./corners-lib.mjs";
import { ensureVectorBootstrap } from "./lib/vector-bootstrap.mjs";

const force = process.argv.includes("--force");
const result = ensureVectorBootstrap(sognaRoot, { force });

console.log(`[vector] ${result.action}: ${result.detail}`);
console.log(`[vector] provider=${result.provider} target=${result.target}`);
if (result.chromaDir) console.log(`[vector] chroma legacy dir: ${result.chromaDir}`);

process.exit(result.ok ? 0 : 1);
