#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const SOGNATORE_CORE = path.join(_dirname, '..', '..', 'Sognatore');
const enginePath = path.join(SOGNATORE_CORE, 'dist', 'Sognatore', 'src', 'bin', 'Sognatore.js');
const args = process.argv.slice(2);

const child = spawn('node', [enginePath, ...args], {
  stdio: 'inherit',
  env: { ...process.env, SOGNATORE_ROOT: SOGNATORE_CORE }
});

child.on('exit', (code) => {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
  process.exit(code || 0);
});
