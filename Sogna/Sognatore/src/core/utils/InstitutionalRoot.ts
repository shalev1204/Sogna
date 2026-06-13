import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resuelve la raíz institucional Sogna (directorio con `.sognarc.json`).
 * No depende solo de process.cwd() — soporta git root → Sogna/ anidado.
 */
export function resolveInstitutionalRoot(startDir?: string): string {
  if (process.env.SOGNA_ROOT && fs.existsSync(path.join(process.env.SOGNA_ROOT, '.sognarc.json'))) {
    return process.env.SOGNA_ROOT;
  }

  const candidates: string[] = [];
  if (startDir) candidates.push(startDir);

  candidates.push(process.cwd());

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  let probe = moduleDir;
  for (let i = 0; i < 8; i++) {
    candidates.push(probe);
    probe = path.dirname(probe);
  }

  for (const base of candidates) {
    let dir = base;
    for (let i = 0; i < 8; i++) {
      const rc = path.join(dir, '.sognarc.json');
      if (fs.existsSync(rc)) return dir;

      const nested = path.join(dir, 'Sogna', '.sognarc.json');
      if (fs.existsSync(nested)) return path.join(dir, 'Sogna');

      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return startDir ?? process.cwd();
}
