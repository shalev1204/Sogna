import { Color } from '@Sogna/Curator';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Resolución dinámica de rutas del Workspace
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
const SENTINEL_DATA_JSON = path.join(WORKSPACE_ROOT, 'Curator/engines/Sentinel/data/signatures.json');
const WATCH_DIR = path.join(WORKSPACE_ROOT, 'Sognatore/src/core');

console.log(Color.bold.green('\n🛡️  INICIANDO DEMONIO DE INTEGRIDAD SENTINEL WATCHER...\n'));
console.log(`- Vigilando: ${Color.cyan(WATCH_DIR)}`);
console.log(`- Base de datos (JSON): ${Color.cyan(SENTINEL_DATA_JSON)}\n`);

// Cola de ejecución asíncrona secuencial FIFO para evitar condiciones de carrera en I/O
class AsyncQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  async enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (err: any) {
          console.error(`${Color.red('❌ [QUEUE-ERROR]')} Error en ejecución secuencial: ${err.message}`);
        }
      }
    }

    this.isProcessing = false;
  }
}

const ioQueue = new AsyncQueue();

// Función segura de re-firmado
async function resignFile(absPath: string) {
  try {
    if (!fs.existsSync(absPath)) return;
    const stats = fs.statSync(absPath);
    if (stats.isDirectory()) return;

    // Solo re-firmar archivos de código fuente válidos
    const ext = path.extname(absPath);
    if (!['.ts', '.js', '.json', '.sh', '.py'].includes(ext)) return;

    const content = fs.readFileSync(absPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Formatear clave relativa institucional (e.g. Sogna/Sognatore/src/core/...)
    const parentDir = path.resolve(WORKSPACE_ROOT, '..');
    const sigKey = path.relative(parentDir, absPath).replace(/\\/g, '/');

    // Leer signatures.json
    let signaturesJson: Record<string, any> = {};
    if (fs.existsSync(SENTINEL_DATA_JSON)) {
      try {
        signaturesJson = JSON.parse(fs.readFileSync(SENTINEL_DATA_JSON, 'utf-8'));
      } catch (e) {
        signaturesJson = {};
      }
    }
    
    // Optimización inteligente: si el hash coincide, abortar escritura en disco
    if (signaturesJson[sigKey] && signaturesJson[sigKey].hash === hash) {
      return;
    }
    
    signaturesJson[sigKey] = {
      hash,
      timestamp: new Date().toISOString(),
      signedBy: 'Sentinel-Auto-Sync'
    };
    fs.writeFileSync(SENTINEL_DATA_JSON, JSON.stringify(signaturesJson, null, 2), 'utf-8');

    console.log(`${Color.green('🔏 [AUTO-SIGN]')} ${Color.cyan(sigKey)} -> ${Color.bold.yellow(hash.slice(0, 8))}... [Re-firmado con éxito]`);
  } catch (err: any) {
    console.error(`${Color.red('❌ [ERROR-SIGN]')} Error re-firmando ${absPath}: ${err.message}`);
  }
}

// Función segura de poda para archivos eliminados
async function pruneFile(absPath: string) {
  try {
    const ext = path.extname(absPath);
    if (!['.ts', '.js', '.json', '.sh', '.py'].includes(ext)) return;

    const parentDir = path.resolve(WORKSPACE_ROOT, '..');
    const sigKey = path.relative(parentDir, absPath).replace(/\\/g, '/');

    let changed = false;

    // Actualizar signatures.json
    if (fs.existsSync(SENTINEL_DATA_JSON)) {
      let signaturesJson: Record<string, any> = {};
      try {
        signaturesJson = JSON.parse(fs.readFileSync(SENTINEL_DATA_JSON, 'utf-8'));
      } catch (e) {
        signaturesJson = {};
      }
      if (signaturesJson[sigKey]) {
        delete signaturesJson[sigKey];
        fs.writeFileSync(SENTINEL_DATA_JSON, JSON.stringify(signaturesJson, null, 2), 'utf-8');
        changed = true;
      }
    }

    if (changed) {
      console.log(`${Color.bold.red('🗑️  [PRUNE]')} ${Color.cyan(sigKey)} [Firma obsoleta podada con éxito]`);
    }
  } catch (err: any) {
    console.error(`${Color.red('❌ [ERROR-PRUNE]')} Error podando firma para ${absPath}: ${err.message}`);
  }
}

// Cola de debouncing reactivo
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Inicializar watcher
try {
  fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const absPath = path.join(WATCH_DIR, filename);

    // Cancelar el temporizador previo para agrupar ráfagas de guardado
    const existing = debounceTimers.get(absPath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      debounceTimers.delete(absPath);
      ioQueue.enqueue(async () => {
        try {
          if (fs.existsSync(absPath)) {
            await resignFile(absPath);
          } else {
            await pruneFile(absPath);
          }
        } catch (err: any) {
          console.error(`${Color.red('❌ [WATCH-ERROR]')} Error al procesar evento de cambio para ${absPath}: ${err.message}`);
        }
      });
    }, 150);

    debounceTimers.set(absPath, timer);
  });
  console.log(Color.bold.blue('✨ Sentinel Watcher está activo y escuchando con inmunidad y debouncing de 150ms...\n'));
} catch (err: any) {
  console.error(Color.bold.red(`❌ Error crítico al iniciar fs.watch: ${err.message}`));
}
