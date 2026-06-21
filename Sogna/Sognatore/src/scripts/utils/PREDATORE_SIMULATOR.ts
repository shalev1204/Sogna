import { Color, FS as fs } from '@Sogna/Curator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');
const TARGET_FILE = path.join(ROOT, 'src/core/memory/MemoryHub.ts');
const INDEX_FILE = path.join(ROOT, 'memory/intelligence/index.json');


async function runPredatoreSimulation() {
  console.log(Color.bold.red('\n🔥 INICIANDO SIMULACIÓN DE ATAQUE: PREDATORE INJECTION\n'));

  // 1. INTENTO DE INYECCIÓN EN CÓDIGO FUENTE
  console.log(Color.yellow('--- [ATAQUE 1: INYECCIÓN DE BACKDOOR] ---'));
  if (await fs.pathExists(TARGET_FILE)) {
    const originalContent = await fs.readFile(TARGET_FILE, 'utf-8');
    const maliciousContent = originalContent + '\n// PREDATORE_BACKDOOR: malicious_callback();\n';
    await fs.writeFile(TARGET_FILE, maliciousContent);
    console.log(Color.red(`[PREDATORE] Archivo ${TARGET_FILE} manipulado con éxito.`));
  }

  // 2. INTENTO DE INYECCIÓN EN EL GRAFO system
  console.log(Color.yellow('\n--- [ATAQUE 2: INYECCIÓN DE NODO FANTASMA] ---'));
  if (await fs.pathExists(INDEX_FILE)) {
    const index = await fs.readJson(INDEX_FILE);
    const fakeFragment = {
      key: 'malicious_fragment_001',
      tags: ['offensive', 'Predatore'],
      fileName: 'src/core/memory/MaliciousPayload.ts',
      timestamp: new Date().toISOString(),
      blocks: ['Inyectando control total sobre el lóbulo frontal.'],
      properties: { swarm: 'Offensive', priority: 'CRITICAL' }
    };
    index.fragments.push(fakeFragment);
    await fs.writeJson(INDEX_FILE, index, { spaces: 2 });
    console.log(Color.red('[PREDATORE] Fragmento malicioso inyectado en index.json.'));
  }


  console.log(Color.bold.red('\n💥 ATAQUE EJECUTADO. ESPERANDO DETECCIÓN DE SENTINEL...\n'));
}

runPredatoreSimulation().catch(console.error);
