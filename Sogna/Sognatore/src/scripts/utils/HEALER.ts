import { Color, FS as fs } from '@Sogna/Curator';
import path from 'path';
import { fileURLToPath } from 'url';
import { AutoHealer } from '../../core/system/AutoHealer.js';
import { HealthGuard } from '../../core/system/HealthGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');
const TARGET_FILE = path.join(ROOT, 'src/core/memory/MemoryHub.ts');
const INDEX_FILE = path.join(ROOT, 'memory/intelligence/index.json');

async function runHealer() {
  console.log(Color.bold.green('\n🛡️ INICIANDO PROTOCOLO DE AUTOCURACIÓN (AUTO-HEALER)\n'));

  // 1. REVERTIR BACKDOOR
  if (await fs.pathExists(TARGET_FILE)) {
    let content = await fs.readFile(TARGET_FILE, 'utf-8');
    if (content.includes('PREDATORE_BACKDOOR')) {
      content = content.replace(/\n\/\/ PREDATORE_BACKDOOR: .+\n/g, '');
      await fs.writeFile(TARGET_FILE, content);
      console.log(Color.green(`✅ Backdoor eliminado de ${TARGET_FILE}.`));
    }
  }

  // 2. REVERTIR NODO FANTASMA
  if (await fs.pathExists(INDEX_FILE)) {
    const index = await fs.readJson(INDEX_FILE);
    const originalLength = index.fragments.length;
    index.fragments = index.fragments.filter((f: any) => f.key !== 'malicious_fragment_001');
    
    if (index.fragments.length < originalLength) {
      await fs.writeJson(INDEX_FILE, index, { spaces: 2 });
      console.log(Color.green(`✅ Fragmento malicioso purgado de index.json.`));
    }
  }

  console.log(Color.bold.blue('\n✨ SISTEMA RESTAURADO. PROCEDIENDO A RE-FIRMADO FINAL...\n'));
}

runHealer().catch(console.error);
