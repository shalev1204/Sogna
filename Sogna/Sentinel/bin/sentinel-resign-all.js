#!/usr/bin/env node
/**
 * Regenera signatures.json al 100% desde git ls-files.
 * Elimina claves legacy (Curator/engines, toolkit/, rutas inexistentes).
 *
 * Uso: node Sentinel/bin/sentinel-resign-all.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const SOGNA_ROOT = path.resolve(__dirname, '../..');
const SIGNATURE_DB = path.join(__dirname, '../data/signatures.json');
const dryRun = process.argv.includes('--dry-run');

const SIGN_EXTS = new Set([
  '.ts', '.js', '.py', '.json', '.sh', '.md', '.mdc', '.yaml', '.yml', '.ps1', '.cjs', '.mjs',
]);

const SKIP_PARTS = [
  'node_modules', 'dist', '.turbo', 'build', '.git', '.next', 'out',
  'chroma.sqlite3', '.cold_run_sim', '.veto_tmp',
];

function findGitRoot(start) {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function isEmbedded(hostRoot) {
  return (
    hostRoot !== SOGNA_ROOT &&
    fs.existsSync(path.join(hostRoot, 'Sogna', '.sognarc.json'))
  );
}

function collectGitFiles(hostRoot, embedded) {
  const globs = embedded
    ? [
        'Sogna/Sognatore/**',
        'Sogna/Curator/**',
        'Sogna/Sentinel/**',
        'Sogna/Predatore/**',
        'Sogna/engines/**',
        'Sogna/memory/**',
        'Sogna/control/**',
        'Sogna/scripts/**',
        'Sogna/.sognarc.json',
        'Sogna/platform.manifest.json',
        'Sogna/package.json',
        'Sogna/pnpm-workspace.yaml',
      ]
    : [
        'Sognatore/**',
        'Curator/**',
        'Sentinel/**',
        'Predatore/**',
        'engines/**',
        'memory/**',
        'control/**',
        'scripts/**',
        '.sognarc.json',
        'platform.manifest.json',
        'package.json',
        'pnpm-workspace.yaml',
      ];

  const cmd = `git ls-files ${globs.map((g) => `"${g}"`).join(' ')}`;
  const output = execSync(cmd, { cwd: hostRoot, encoding: 'utf-8' });
  return output
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((rel) => {
      if (SKIP_PARTS.some((p) => rel.includes(p))) return false;
      const ext = path.extname(rel).toLowerCase();
      const base = path.basename(rel);
      if (SIGN_EXTS.has(ext)) return true;
      if (base === '.sognarc.json' || base === 'platform.manifest.json') return true;
      return false;
    });
}

function main() {
  const hostRoot = findGitRoot(SOGNA_ROOT);
  const embedded = isEmbedded(hostRoot);
  const files = collectGitFiles(hostRoot, embedded);

  console.log(`[RESIGN-ALL] host=${hostRoot} embedded=${embedded} files=${files.length}`);

  const signatures = {};
  let signed = 0;
  let skipped = 0;

  for (const rel of files) {
    const abs = path.join(hostRoot, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      skipped++;
      continue;
    }
    try {
      const content = fs.readFileSync(abs);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const key = rel.replace(/\\/g, '/');
      signatures[key] = {
        hash,
        timestamp: new Date().toISOString(),
        signedBy: 'Sentinel-Resign-All',
      };
      signed++;
    } catch (e) {
      console.warn(`[SKIP] ${rel}: ${e.message}`);
      skipped++;
    }
  }

  let legacyRemoved = 0;
  if (fs.existsSync(SIGNATURE_DB)) {
    try {
      const old = JSON.parse(fs.readFileSync(SIGNATURE_DB, 'utf-8'));
      legacyRemoved = Object.keys(old).length;
    } catch (_) {
      legacyRemoved = 0;
    }
  }

  console.log(`[RESIGN-ALL] firmados=${signed} omitidos=${skipped} claves_anteriores=${legacyRemoved}`);

  if (dryRun) {
    console.log('[RESIGN-ALL] dry-run: no se escribió signatures.json');
    return;
  }

  fs.writeFileSync(SIGNATURE_DB, JSON.stringify(signatures, null, 2));
  console.log(`[RESIGN-ALL] OK → ${SIGNATURE_DB}`);
}

main();
