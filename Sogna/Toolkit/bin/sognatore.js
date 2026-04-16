#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOGNATORE_CORE = path.join(__dirname, '..', '..', 'Sognatore');
const enginePath = path.join(SOGNATORE_CORE, 'dist', 'bin', 'sognatore.js');
const args = process.argv.slice(2);

const child = spawn('node', [enginePath, ...args], {
  stdio: 'inherit',
  env: { ...process.env, SOGNATORE_ROOT: SOGNATORE_CORE }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
