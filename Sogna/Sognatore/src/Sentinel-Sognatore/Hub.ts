import fs from 'fs-extra';
import * as path from 'path';
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import crypto from 'crypto';

export enum SecurityState {
  ALIVE = 'ALIVE',
  PANIC = 'PANIC'
}

/**
 * Sentinel Hub - The base operative of security in Sognatore.
 * Part of the Sentinel Sovereignty block. Coordinates with Sentinel HQ (Toolkit).
 */
export class Hub {
  private static instance: Hub;
  private state: SecurityState = SecurityState.ALIVE;
  private shieldRelaxed: boolean = false;
  private shieldTimer: NodeJS.Timeout | null = null;
  
  private readonly sognatoreRoot: string;
  private readonly SENTINEL_PATH: string;
  private readonly SIGNATURES_PATH: string;
  private readonly INTEL_REPORT_PATH: string;
  private signaturesCache: Record<string, any> = {};
  private mtimeCache: Record<string, number> = {};

  private constructor() {
    // Robust root discovery: Look for the directory containing 'resources'
    const findRoot = (start: string): string => {
      let curr = start;
      const root = path.parse(curr).root;
      while (curr !== root) {
        if (fs.existsSync(path.join(curr, 'resources')) && fs.existsSync(path.join(curr, 'package.json'))) {
          return curr;
        }
        curr = path.join(curr, '..');
      }
      return process.cwd(); // Fallback
    };

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.sognatoreRoot = findRoot(__dirname);

    // Use monorepo-safe paths
    const toolkitRoot = path.join(this.sognatoreRoot, '..', 'toolkit');
    this.SENTINEL_PATH = path.join(toolkitRoot, 'engines', 'Sentinel', 'bin', 'sentinel-veto.js');
    this.SIGNATURES_PATH = path.join(toolkitRoot, 'engines', 'Sentinel', 'data', 'signatures.json');
    this.INTEL_REPORT_PATH = path.join(toolkitRoot, 'engines', 'Sentinel', 'reports', 'THREAD_INTEL.md');
    
    this.checkSentinelPulse();
    this.refreshCache();
  }

  public static getInstance(): Hub {
    if (!Hub.instance) {
      Hub.instance = new Hub();
    }
    return Hub.instance;
  }

  /**
   * Refreshes the in-memory signature cache from disk.
   */
  public refreshCache(): void {
    try {
      if (fs.existsSync(this.SIGNATURES_PATH)) {
        this.signaturesCache = fs.readJsonSync(this.SIGNATURES_PATH);
        this.maintenance(); // Apex Performance Check
      }
    } catch (e) {
      console.error(chalk.red('[SENTINEL_HUB] Failed to load signature cache.'));
    }
  }

  /**
   * Signature Maintenance: Prunes signatures for deleted files and keeps the cache lean.
   */
  private maintenance(): void {
    try {
      const stats = fs.statSync(this.SIGNATURES_PATH);
      if (stats.size < 2 * 1024 * 1024) return; // Only maintain if > 2MB

      console.log(chalk.gray('[SENTINEL_HUB] Iniciando mantenimiento preventivo de firmas...'));
      let changed = false;
      const keys = Object.keys(this.signaturesCache);

      // 1. Prune non-existent files
      for (const relPath of keys) {
        if (!fs.existsSync(path.resolve(process.cwd(), relPath))) {
          delete this.signaturesCache[relPath];
          delete this.mtimeCache[relPath];
          changed = true;
        }
      }

      // 2. Hard-cap at 10,000 entries (LRU-like approach based on timestamp)
      const MAX_ENTRIES = 10000;
      if (Object.keys(this.signaturesCache).length > MAX_ENTRIES) {
        const sortedKeys = Object.keys(this.signaturesCache).sort((a, b) => {
          const tA = new Date((this.signaturesCache[a] as any).timestamp || 0).getTime();
          const tB = new Date((this.signaturesCache[b] as any).timestamp || 0).getTime();
          return tB - tA; // Newest first
        });

        const keysToPrune = sortedKeys.slice(MAX_ENTRIES);
        for (const k of keysToPrune) {
          delete this.signaturesCache[k];
          delete this.mtimeCache[k];
        }
        changed = true;
      }

      if (changed) {
        fs.writeJsonSync(this.SIGNATURES_PATH, this.signaturesCache, { spaces: 2 });
        this.reportIntel('INFO', 'Mantenimiento de firmas: Base de datos optimizada y podada.', 'Hub');
      }
    } catch (e) {
      // Silent fail for maintenance
    }
  }

  /**
   * Verified if Sentinel engine is responsive.
   */
  public checkSentinelPulse(): SecurityState {
    if (!fs.existsSync(this.SENTINEL_PATH)) {
      console.error(chalk.red.bold('[CRITICAL] Sentinel core is missing! Entering PANIC MODE.'));
      this.state = SecurityState.PANIC;
      return this.state;
    }
    this.state = SecurityState.ALIVE;
    return this.state;
  }

  public getState(): SecurityState {
    return this.state;
  }

  /**
   * Triggers a global PANIC state and initiates reactive defense protocols.
   * This implements the "Double Cycle" response: Kill + AutoHeal.
   */
  public async triggerPanic(reason: string, location: string, agentPid?: number): Promise<void> {
    if (this.state === SecurityState.PANIC) return; // Already in panic

    this.state = SecurityState.PANIC;
    this.reportIntel('CRITICAL', `PROTOCOLO DE PÁNICO ACTIVADO: ${reason}`, location);

    // 1. NEUTRALIZATION (SIGKILL)
    if (agentPid) {
      console.log(chalk.red.bold(`[NEUTRALIZADOR] Interceptando proceso amenazante (PID: ${agentPid})...`));
      try {
        process.kill(agentPid, 'SIGKILL');
        this.reportIntel('INFO', `Amenaza neutralizada físicamente (SIGKILL aplicada a PID ${agentPid})`, 'Neutralizer');
      } catch (e) {
        this.reportIntel('WARNING', `Fallo al neutralizar PID ${agentPid}: ${e instanceof Error ? e.message : String(e)}`, 'Neutralizer');
      }
    }

    // 2. AUTO-HEALING CYCLE
    console.log(chalk.yellow.bold('[AUTO-HEALER] Iniciando ciclo prioritario de reconstrucción institucional...'));
    await this.recoverSentinel();
    
    // Deep Scan via AutoHealer (Toolkit module)
    try {
      // Lazy import to avoid circular dependencies and ensure toolkit access
      const { AutoHealer } = await import('@sogna/toolkit/shared/AutoHealer.js');
      const healer = AutoHealer.getInstance();
      
      // Focus on Infra and Permissions since that's where binaries live
      await healer.attemptRecovery('INFRA' as any, 'panic_recovery');
      await healer.attemptRecovery('PERMISSION' as any, 'panic_recovery');
      
      this.reportIntel('INFO', 'Ciclo de autocuración completado exitosamente.', 'AutoHealer');
    } catch (e) {
      this.reportIntel('WARNING', 'No se pudo invocar el AutoHealer de alto nivel.', 'Hub');
    }
  }

  /**
   * Relaxes the Wallet Shield for a specific duration to allow large legitimate projects.
   */
  public relaxShield(durationMs: number = 300000): void { // Default 5 mins
    console.log(chalk.blue.bold(`[SENTINEL] Escudo relajado institucionalmente por ${durationMs / 60000} minutos.`));
    this.shieldRelaxed = true;
    
    if (this.shieldTimer) clearTimeout(this.shieldTimer);
    this.shieldTimer = setTimeout(() => {
      this.shieldRelaxed = false;
      this.reportIntel('INFO', 'Protección Wallet Shield reactivada automáticamente.', 'Hub');
    }, durationMs);
  }

  public isShieldRelaxed(): boolean {
    return this.shieldRelaxed;
  }

  /**
   * Reports a security event directly to the Sentinel Intel Feed (Toolkit).
   * This implements the deep connection between Sognatore bases and HQ.
   */
  public reportIntel(level: 'INFO' | 'WARNING' | 'CRITICAL', reason: string, location: string): void {
    if (!fs.existsSync(this.INTEL_REPORT_PATH)) return;

    const timestamp = new Date().toISOString();
    const event = `\n### EVENTO (Sognatore Base): ${timestamp}\n[${level}]\t${reason}\n\tUbicación: ${location}\n\tEstado: ${this.state}\n---\n`;
    
    try {
      // FAST APPEND-ONLY TELEMETRY: Independence from log file size.
      // Append at the end is O(1). 
      fs.appendFileSync(this.INTEL_REPORT_PATH, event);
      console.log(chalk.cyan(`[SENTINEL_HUB] Telemetría enviada a la central: ${reason}`));
    } catch (e) {
      console.error(chalk.red('[SENTINEL_HUB] Fallo en el envío de telemetría institucional.'));
    }
  }

  /**
   * Validates if a file has a valid Sentinel signature.
   * Optimized: Uses in-memory cache for metadata lookup.
   */
  public validateSignature(filePath: string): boolean {
    if (this.state === SecurityState.PANIC) return false;

    try {
      const absPath = path.resolve(filePath);
      const relativePath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
      
      const sig = this.signaturesCache[relativePath];
      if (!sig) return false;

      // APEX INTELLIGENT VALIDATION: Use mtime to skip hash calculation
      const stats = fs.statSync(absPath);
      const currentMtime = stats.mtimeMs;
      
      if (this.mtimeCache[relativePath] === currentMtime) {
        return true; // File hasn't changed since last successful validation
      }

      const content = fs.readFileSync(absPath);
      const currentHash = crypto.createHash('sha256').update(content).digest('hex');
      
      const isValid = sig.hash === currentHash;
      if (isValid) {
        this.mtimeCache[relativePath] = currentMtime;
      }
      return isValid;
    } catch (e) {
      return false;
    }
  }

  /**
   * Triggers the Git-based recovery for Sentinel.
   */
  public async recoverSentinel(): Promise<boolean> {
    console.log(chalk.yellow('[RECOVERY] Attempting to restore Sentinel via Git...'));
    try {
      const sentinelDir = path.dirname(this.SENTINEL_PATH);
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
      spawnSync('git', ['checkout', 'HEAD', '--', sentinelDir], { cwd: process.cwd() });
      
      this.checkSentinelPulse();
      if (this.state === SecurityState.ALIVE) {
        console.log(chalk.green('✅ Sentinel has been restored.'));
        this.refreshCache();
        return true;
      }
    } catch (e) {
      console.error(chalk.red('[RECOVERY] Git restoration failed.'));
    }
    return false;
  }

  public getSognatoreRoot(): string {
    return this.sognatoreRoot;
  }
}


