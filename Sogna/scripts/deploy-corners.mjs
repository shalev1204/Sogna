#!/usr/bin/env node
import {
  assertSsotPresent,
  cornersSsot,
  deployCorner,
  deployIgnores,
  hostRootFor,
  isEmbeddedLayout,
  sognaRoot,
} from "./corners-lib.mjs";

assertSsotPresent();

console.log("=== Deploy Capa 2 corners ===");
console.log(`SSOT: ${cornersSsot}`);
console.log("");

console.log("=== Deploy ignores (git / rg / IDE index) ===");

deployCorner(sognaRoot, "monorepo");

const hostRoot = hostRootFor(sognaRoot);
if (isEmbeddedLayout(sognaRoot)) {
  deployIgnores(hostRoot, "host", { includeGit: true });
  deployIgnores(sognaRoot, "monorepo");
  console.log("");
  deployCorner(hostRoot, "embedded-host");
} else {
  deployIgnores(sognaRoot, "monorepo", { includeGit: true });
  console.log("-- embedded-host: skip (no Sogna/ subfolder layout) --");
}

console.log("");
console.log("Done. Run: node scripts/verify-corners.mjs");
