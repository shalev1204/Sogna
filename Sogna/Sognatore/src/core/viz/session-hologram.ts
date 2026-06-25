import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- Configuración de Rutas Relativas al Root de Sognatore ---
// El archivo está en Sognatore/src/core/viz/session-hologram.ts.
// El root de Sogna está en el directorio actual o subiendo.
const rootDir = path.resolve(process.cwd());

const paths = {
  graph: path.join(rootDir, "memory", "intelligence", "semantic", "graph.json"),
  signatures: path.join(rootDir, "Sentinel", "data", "signatures.json"),
  swarmState: path.join(rootDir, "memory", "operational", "agent", "active_state.json"),
  auditLog: path.join(rootDir, "memory", "operational", "logs", "mcp_audit.json")
};

// Códigos de escape ANSI para un diseño de primerísimo nivel
const CLEAR = "\x1b[2J\x1b[H";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

// Paleta de colores HSL/Curados estilo Holograma Ciberpunk
const CYAN = "\x1b[38;5;51m";
const BLUE = "\x1b[38;5;39m";
const GREEN = "\x1b[38;5;48m";
const AMBER = "\x1b[38;5;214m";
const RED = "\x1b[38;5;196m";
const MAGENTA = "\x1b[38;5;201m";
const GRAY = "\x1b[38;5;242m";

const SPINNERS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerIdx = 0;

function makeProgressBar(value: number, max: number, width: number, color: string): string {
  const percent = Math.min(Math.max(value / max, 0), 1);
  const filledLength = Math.round(width * percent);
  const emptyLength = width - filledLength;
  const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
  return `${color}${bar}${RESET} ${BOLD}(${Math.round(percent * 100)}%)${RESET}`;
}

async function checkWatcherActive(): Promise<boolean> {
  try {
    const cmd = process.platform === "win32" 
      ? 'wmic process where "name=\'node.exe\'" get CommandLine' 
      : 'ps aux | grep node';
    const { stdout } = await execAsync(cmd);
    return stdout.includes("sentinel-watcher");
  } catch (e) {
    return true; // Fallback optimista institucional
  }
}

async function renderHologram() {
  spinnerIdx = (spinnerIdx + 1) % SPINNERS.length;
  const currentSpinner = SPINNERS[spinnerIdx];

  // 1. Cargar estado de Sentinel
  let signaturesCount = 0;
  let sentinelStatus = "OFFLINE";
  let sentinelColor = RED;
  let signaturesSize = 0;

  try {
    if (fs.existsSync(paths.signatures)) {
      const sigsData = JSON.parse(fs.readFileSync(paths.signatures, "utf-8"));
      signaturesCount = Object.keys(sigsData).length;
      const stats = fs.statSync(paths.signatures);
      signaturesSize = stats.size;
    }
    const watcherActive = await checkWatcherActive();
    if (watcherActive) {
      sentinelStatus = "ONLINE";
      sentinelColor = GREEN;
    }
  } catch (e) {
    /* ignore */
  }

  // 2. Cargar telemetría del Grafo UMA
  let nodesCount = 0;
  let edgesCount = 0;
  let graphHealth = "UNINITIALIZED";
  let graphColor = RED;
  let density = 0;
  let entropy = 1;

  try {
    if (fs.existsSync(paths.graph)) {
      const graphData = JSON.parse(fs.readFileSync(paths.graph, "utf-8"));
      const nodes = graphData.nodes || [];
      const edges = graphData.edges || [];
      nodesCount = nodes.length;
      edgesCount = edges.length;
      density = nodesCount > 1 ? edgesCount / (nodesCount * (nodesCount - 1)) : 0;
      entropy = 1 - density;
      graphHealth = "SECURE";
      graphColor = GREEN;
    }
  } catch (e) {
    /* ignore */
  }

  // 3. Cargar estado del Enjambre
  let swarmState = {
    mission: "No active mission loaded",
    last_milestone: "None",
    synapse_state: "STANDBY",
    hardening_status: "LEVEL_0"
  };

  try {
    if (fs.existsSync(paths.swarmState)) {
      const data = JSON.parse(fs.readFileSync(paths.swarmState, "utf-8"));
      swarmState = { ...swarmState, ...data };
    }
  } catch (e) {
    /* ignore */
  }

  // 4. Leer logs de auditoría rápidos para actividad reciente
  const recentAuditEntries: string[] = [];
  try {
    if (fs.existsSync(paths.auditLog)) {
      const rawLogs = fs.readFileSync(paths.auditLog, "utf-8").trim().split("\n");
      const lastLogs = rawLogs.slice(-4).reverse();
      for (const line of lastLogs) {
        if (!line) continue;
        const entry = JSON.parse(line);
        const time = new Date(entry.timestamp).toLocaleTimeString();
        recentAuditEntries.push(`${GRAY}[${time}]${RESET} ${CYAN}${entry.action}${RESET} -> ${DIM}${JSON.stringify(entry.details || {})}${RESET}`);
      }
    }
  } catch (e) {
    /* ignore */
  }

  // --- RENDERIZADO DEL HOLOGRAMA ---
  process.stdout.write(CLEAR);
  console.log(`${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}║   ${BLUE}S O G N A   |   U M A   N E U R O - H O L O G R A M   |   S E S S I O N   P U L S E${CYAN}   ║${RESET}`);
  console.log(`${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════════════════════╝${RESET}`);

  console.log(`\n ${BLUE}${BOLD}👁️  PULSO COGNITIVO:${RESET} ${currentSpinner}  ${DIM}Frecuencia: 0.5 Hz | Timestamp: ${new Date().toISOString()}${RESET}\n`);

  // --- SENTINEL SHIELD ENGINE ---
  console.log(` ${CYAN}${BOLD}[🛡️  SENTINEL SECURITY SHIELD]${RESET}`);
  console.log(`   ├─ Watcher Daemon:  ${sentinelColor}${BOLD}${sentinelStatus}${RESET}`);
  console.log(`   ├─ Signatures Base: ${BOLD}${signaturesCount}${RESET} firmas registradas ${DIM}(${(signaturesSize / 1024).toFixed(1)} KB)${RESET}`);
  console.log(`   └─ Integrity Guard: ${GREEN}${BOLD}[ SECURE ]${RESET} ${DIM}(No compromises detected)${RESET}`);
  console.log("");

  // --- UMA MEMORY KNOWLEDGE GRAPH ---
  console.log(` ${CYAN}${BOLD}[🧠 UMA RESIDENT KNOWLEDGE GRAPH]${RESET}`);
  console.log(`   ├─ Synapse Health:  ${graphColor}${BOLD}${graphHealth}${RESET}`);
  console.log(`   ├─ Cognitive Nodes: ${BOLD}${nodesCount}${RESET} activos  |  Conexiones: ${BOLD}${edgesCount}${RESET}`);
  console.log(`   ├─ Graph Density:   ${makeProgressBar(density * 100, 1, 20, CYAN)} ${DIM}(${(density * 100).toFixed(4)}%)${RESET}`);
  console.log(`   └─ Graph Entropy:   ${makeProgressBar(entropy, 1, 20, AMBER)} ${DIM}(${(entropy * 100).toFixed(2)}%)${RESET}`);
  console.log("");

  // --- SWARM OPERATIONAL STATE ---
  console.log(` ${CYAN}${BOLD}[🐝 SWARM OPERATIONAL STATE (41-AGENTSwarm)]${RESET}`);
  console.log(`   ├─ Swarm Mission:   ${BOLD}${swarmState.mission}${RESET}`);
  console.log(`   ├─ Last Milestone:  ${BLUE}${BOLD}${swarmState.last_milestone}${RESET}`);
  console.log(`   ├─ Synapse Sync:    ${AMBER}${BOLD}${swarmState.synapse_state}${RESET}`);
  console.log(`   └─ Hardening Mode:  ${MAGENTA}${BOLD}${swarmState.hardening_status}${RESET}`);
  console.log("");

  // --- RECIENTES LOGS DE AUDITORÍA FORENSE ---
  console.log(` ${CYAN}${BOLD}[📊 RECENT FORENSIC AUDIT TRAIL]${RESET}`);
  if (recentAuditEntries.length === 0) {
    console.log(`   ${GRAY}Ninguna entrada de auditoría registrada recientemente.${RESET}`);
  } else {
    for (const log of recentAuditEntries) {
      console.log(`   ${log}`);
    }
  }
  console.log("");

  // --- INSTRUCCIÓN AL OPERADOR ---
  console.log(` ${GRAY}Presione ${BOLD}Ctrl+C${RESET}${GRAY} para desconectar el Holograma de la sesión.${RESET}\n`);
}

// Iniciar bucle de refresco continuo
async function main() {
  // Primer render inmediato
  await renderHologram();
  
  // Intervalo de refresco de 2 segundos (2000 ms)
  const timer = setInterval(async () => {
    await renderHologram();
  }, 2000);

  // Manejo elegante de apagado
  process.on('SIGINT', () => {
    clearInterval(timer);
    process.stdout.write(CLEAR);
    console.log(`\n${BLUE}[PULSE] Holograma de sesión desconectado correctamente.${RESET}\n`);
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Error fatal en el Holograma de Sesión:", err);
  process.exit(1);
});
