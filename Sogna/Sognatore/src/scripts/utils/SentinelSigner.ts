import { Color, FS as fs } from '@Sogna/Curator';

import crypto from 'crypto';
import path from 'path';


const ROOT = 'c:/Users/carle/Desktop/Sogna';
const SENTINEL_DATA = path.join(ROOT, 'Sogna/Curator/engines/Sentinel/data/signatures.json');

async function signFiles() {
  console.log(Color.bold.green('\n🛡️ INICIANDO FIRMADO DE INTEGRIDAD SENTINEL...\n'));

  const filesToSign = [
    'Sognatore/src/core/memory/MemoryHub.ts',
    'Sognatore/src/core/memory/Chronicler.ts',
    'Curator/bin/sogna.ts'
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
        signedBy: 'Sentinel-Main-Optimizer'
      };
      console.log(`- Firmado: ${Color.cyan(sigKey)} [${hash.slice(0, 8)}...]`);
    } else {
      console.log(Color.red(`- ERROR: No se encuentra ${absPath}`));
    }
  }

  await fs.writeJson(SENTINEL_DATA, signatures, { spaces: 2 });
  console.log(Color.bold.blue('\n✅ FIRMADO COMPLETADO. INTEGRIDAD ASEGURADA.\n'));
}

signFiles().catch(console.error);
