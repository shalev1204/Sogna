import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FS as fs } from './utils/fs.js';

/** Motores de primer nivel (no viven bajo `engines/`). */
export const STANDALONE_MOTORS = new Set(['Sentinel', 'Predatore', 'Sognatore']);

export type EngineScope = 'root' | 'engines';

export interface EngineDefinition {
  path: string;
  scope?: EngineScope;
  type?: string;
  status?: string;
}

/**
 * Resuelve sogna_root (directorio con `.sognarc.json`).
 */
export function resolveSognaRoot(startDir?: string): string {
  if (process.env.SOGNA_ROOT && fs.existsSync(path.join(process.env.SOGNA_ROOT, '.sognarc.json'))) {
    return process.env.SOGNA_ROOT;
  }

  const candidates: string[] = [];
  if (startDir) candidates.push(startDir);
  candidates.push(process.cwd());

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  let probe = moduleDir;
  for (let i = 0; i < 10; i++) {
    candidates.push(probe);
    probe = path.dirname(probe);
  }

  for (const base of candidates) {
    let dir = base;
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(dir, '.sognarc.json'))) return dir;
      const nested = path.join(dir, 'Sogna', '.sognarc.json');
      if (fs.existsSync(nested)) return path.join(dir, 'Sogna');
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return startDir ?? process.cwd();
}

export function engineScope(name: string, def?: EngineDefinition): EngineScope {
  if (def?.scope) return def.scope;
  if (STANDALONE_MOTORS.has(def?.path ?? name)) return 'root';
  return 'engines';
}

/** Ruta absoluta de un motor respecto a sogna_root. */
export function resolveEngineDir(sognaRoot: string, name: string, def?: EngineDefinition): string {
  const segment = def?.path ?? name;
  const scope = engineScope(name, def);
  if (scope === 'root') return path.join(sognaRoot, segment);
  return path.join(sognaRoot, 'engines', segment);
}

export function sentinelDir(sognaRoot: string, ...parts: string[]): string {
  return path.join(sognaRoot, 'Sentinel', ...parts);
}

export function predatoreDir(sognaRoot: string, ...parts: string[]): string {
  return path.join(sognaRoot, 'Predatore', ...parts);
}

export function bundledEngineDir(sognaRoot: string, engine: string, ...parts: string[]): string {
  return path.join(sognaRoot, 'engines', engine, ...parts);
}
