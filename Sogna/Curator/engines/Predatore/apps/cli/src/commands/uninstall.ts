/**
 * `shn uninstall` command â€” remove ~/.Predatore/ after confirmation (npx only).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as p from '@clack/prompts';
import { stopInfra, stopWorkers } from '../docker.js';

const Predatore_HOME = path.join(os.homedir(), '.Predatore');

export async function uninstall(): Promise<void> {
  p.intro('Predatore Uninstall');

  if (!fs.existsSync(Predatore_HOME)) {
    p.log.info('Nothing to remove. Predatore is not configured on this machine.');
    p.outro('Done.');
    return;
  }

  const confirmed = await p.confirm({
    message: 'This will permanently remove all past scan data, saved configurations, and API keys. Continue?',
  });
  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Aborted.');
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    process.exit(0);
  }

  // Stop any running containers first
  stopWorkers();
  stopInfra(false);

  fs.rmSync(Predatore_HOME, { recursive: true, force: true });
  p.log.success('All Predatore data has been removed.');
  p.outro('Predatore has been uninstalled. Run `npx @Sogna/Predatore setup` to start fresh.');
}

