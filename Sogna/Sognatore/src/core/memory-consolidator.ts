import { Color } from '@Sogna/Curator';
import os from 'os';
import http from 'http';

/**
 * Sogna Memory Consolidator (Synaptic Background Daemon)
 * Periodically audits CPU workload and agent idle state.
 * Triggers the 3-phase consolidation pipeline on the resident UMA Server (port 8080) programmatically.
 */
export class MemoryConsolidator {
  private static instance: MemoryConsolidator;
  private intervalId: NodeJS.Timeout | null = null;
  private isConsolidating: boolean = false;
  private lastActivityTime: number = Date.now();
  private readonly CHECK_INTERVAL_MS = 60000; // Check every 60 seconds
  private readonly IDLE_THRESHOLD_MS = 3600000; // 1 hour (3600 seconds)
  private readonly CPU_THRESHOLD_PERCENT = 40; // Only run if CPU usage is below 40%

  private constructor() {}

  static getInstance(): MemoryConsolidator {
    if (!MemoryConsolidator.instance) {
      MemoryConsolidator.instance = new MemoryConsolidator();
    }
    return MemoryConsolidator.instance;
  }

  /**
   * Tracks user or system activity to reset the idle timer.
   */
  public recordActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Starts the background consolidator daemon.
   */
  public start(): void {
    if (this.intervalId) {
      return;
    }
    console.log(Color.bold.blue('[MEMORY CONSOLIDATOR] Starting background synaptic daemon...'));
    this.intervalId = setInterval(() => this.checkAndConsolidate(), this.CHECK_INTERVAL_MS);
  }

  /**
   * Stops the background consolidator daemon.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(Color.bold.yellow('[MEMORY CONSOLIDATOR] Background synaptic daemon stopped.'));
    }
  }

  private async checkAndConsolidate(): Promise<void> {
    if (this.isConsolidating) return;

    const now = Date.now();
    const idleTimeMs = now - this.lastActivityTime;

    if (idleTimeMs < this.IDLE_THRESHOLD_MS) {
      // Not idle enough yet
      return;
    }

    try {
      this.isConsolidating = true;

      // Check CPU load dynamically on Windows
      const cpuUsage = await this.getCpuUsage();
      if (cpuUsage > this.CPU_THRESHOLD_PERCENT) {
        console.log(Color.yellow(`[MEMORY CONSOLIDATOR] System idle but CPU load too high (${cpuUsage}%). Skipping consolidation.`));
        this.isConsolidating = false;
        return;
      }

      console.log(Color.bold.cyan(`[MEMORY CONSOLIDATOR] System is idle (${Math.round(idleTimeMs / 1000)}s) and CPU is calm (${cpuUsage}%). Triggering synaptic consolidation...`));
      
      const success = await this.triggerUmaConsolidation();
      if (success) {
        console.log(Color.bold.green('[MEMORY CONSOLIDATOR] Synaptic consolidation completed successfully and graph reloaded.'));
      } else {
        console.error(Color.red('[MEMORY CONSOLIDATOR] Synaptic consolidation failed on UMA Server.'));
      }
    } catch (e: any) {
      console.error(Color.red(`[MEMORY CONSOLIDATOR] Error during idle consolidation check: ${e.message}`));
    } finally {
      this.isConsolidating = false;
    }
  }

  private triggerUmaConsolidation(): Promise<boolean> {
    return this.sendConsolidationRequestWithRetry(0);
  }

  private sendConsolidationRequestWithRetry(retryCount: number): Promise<boolean> {
    const maxRetries = 3;
    const baseTimeoutMs = 10000; // Strict 10-second timeout
    const baseDelayMs = 1000; // Exponential backoff base (1s)

    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 8080,
          path: '/memory/consolidate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(true);
            } else {
              console.error(`[MEMORY CONSOLIDATOR] UMA server returned status ${res.statusCode}: ${body}`);
              this.handleRetryOrResolve(retryCount, maxRetries, baseDelayMs, resolve);
            }
          });
        }
      );

      // Control de timeout estricto
      req.setTimeout(baseTimeoutMs, () => {
        console.warn(`[MEMORY CONSOLIDATOR] La conexion expiro despues de ${baseTimeoutMs}ms (Intento ${retryCount + 1}/${maxRetries})`);
        req.destroy(); // Destrucción activa de sockets para evitar fugas de recursos
      });

      req.on('error', (err) => {
        console.warn(`[MEMORY CONSOLIDATOR] Fallo al contactar el servidor UMA: ${err.message} (Intento ${retryCount + 1}/${maxRetries})`);
        this.handleRetryOrResolve(retryCount, maxRetries, baseDelayMs, resolve);
      });

      req.write(JSON.stringify({}));
      req.end();
    });
  }

  private handleRetryOrResolve(
    retryCount: number,
    maxRetries: number,
    baseDelayMs: number,
    resolve: (value: boolean) => void
  ): void {
    if (retryCount < maxRetries - 1) {
      const nextDelay = baseDelayMs * Math.pow(2, retryCount); // 1s, 2s, 4s
      console.log(`[MEMORY CONSOLIDATOR] Reintentando conexion con el servidor UMA en ${nextDelay}ms...`);
      setTimeout(() => {
        this.sendConsolidationRequestWithRetry(retryCount + 1).then(resolve);
      }, nextDelay);
    } else {
      console.error(`[MEMORY CONSOLIDATOR] Se supero el maximo de reintentos (${maxRetries}). Abortando consolidacion.`);
      resolve(false);
    }
  }

  private getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        if (totalDifference === 0) {
          resolve(0);
          return;
        }
        const percentageCpu = 100 - Math.round((100 * idleDifference) / totalDifference);
        resolve(percentageCpu);
      }, 100);
    });
  }

  private cpuAverage() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) {
      return { idle: 0, total: 0 };
    }
    let idleMs = 0;
    let totalMs = 0;
    cpus.forEach((core) => {
      for (const type in core.times) {
        totalMs += (core.times as any)[type];
      }
      idleMs += core.times.idle;
    });
    return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
  }
}
