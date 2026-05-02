import fs from 'fs-extra';
import crypto from 'crypto';
import path from 'path';
import chalk from 'chalk';

const ROOT = 'c:/Users/carle/Desktop/Sogna';
const SENTINEL_DATA = path.join(ROOT, 'Sogna/toolkit/engines/Sentinel/data/signatures.json');

async function signFiles() {
  console.log(chalk.bold.green('\n🛡️ INICIANDO FIRMADO DE INTEGRIDAD SENTINEL...\n'));

  const filesToSign = [
    'Sognatore/src/core/memory/MemoryHub.ts',
    'Sognatore/src/core/memory/Chronicler.ts',
    'toolkit/bin/sogna.js'
  ];

  const signatures = await fs.readJson(SENTINEL_DATA);

  for (const relPath of filesToSign) {
    const absPath = path.join(ROOT, 'Sogna', relPath);
    if (await fs.pathExists(absPath)) {
      const content = await fs.readFile(absPath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      const sigKey = `Sogna/${relPath.replace(/\//g, '/')}`;
      signatures[sigKey] = {
        hash,
        timestamp: new Date().toISOString(),
        signedBy: 'Sentinel-Apex-Optimizer'
      };
      console.log(`- Firmado: ${chalk.cyan(sigKey)} [${hash.slice(0, 8)}...]`);
    } else {
      console.log(chalk.red(`- ERROR: No se encuentra ${absPath}`));
    }
  }

  await fs.writeJson(SENTINEL_DATA, signatures, { spaces: 2 });
  console.log(chalk.bold.blue('\n✅ FIRMADO COMPLETADO. INTEGRIDAD ASEGURADA.\n'));
}

signFiles().catch(console.error);
