import { Hub } from './Hub.js';

export interface ActivityStats {
  commandCount: number;
  sensitiveOps: number;
  lastTimestamp: number;
  anomaliesDetected: number;
}

/**
 * ActivityProfile - Monitors session behavior to detect hijacked agents or rogue scripts.
 */
export class ActivityProfile {
  private static instance: ActivityProfile;
  private stats: ActivityStats = {
    commandCount: 0,
    sensitiveOps: 0,
    lastTimestamp: Date.now(),
    anomaliesDetected: 0
  };

  private readonly BURST_THRESHOLD = 15; // Commands per minute
  private readonly SENSITIVE_BURST_THRESHOLD = 5; // Sensitive ops per minute

  public static getInstance(): ActivityProfile {
    if (!ActivityProfile.instance) ActivityProfile.instance = new ActivityProfile();
    return ActivityProfile.instance;
  }

  /**
   * Records a command execution and checks for behavioral anomalies.
   */
  public analyzeActivity(command: string, isSensitive: boolean): { isAnomalous: boolean; reason?: string } {
    const now = Date.now();
    const timeDiffMinutes = (now - this.stats.lastTimestamp) / 60000;
    
    // Reset window every minute for simplicity
    if (timeDiffMinutes >= 1) {
      this.stats.commandCount = 0;
      this.stats.sensitiveOps = 0;
      this.stats.lastTimestamp = now;
    }

    this.stats.commandCount++;
    if (isSensitive) this.stats.sensitiveOps++;

    // 1. Detect Command Burst (Wallet/System Stress)
    if (this.stats.commandCount > this.BURST_THRESHOLD) {
      this.stats.anomaliesDetected++;
      return { 
        isAnomalous: true, 
        reason: `Command burst detected: ${this.stats.commandCount} cmds/min exceeded threshold of ${this.BURST_THRESHOLD}` 
      };
    }

    // 2. Detect Sensitive Operation Spikes
    if (this.stats.sensitiveOps > this.SENSITIVE_BURST_THRESHOLD) {
      this.stats.anomaliesDetected++;
      return { 
        isAnomalous: true, 
        reason: `Sensitive operation spike: ${this.stats.sensitiveOps} ops/min exceeded threshold of ${this.SENSITIVE_BURST_THRESHOLD}` 
      };
    }

    // 3. Detect "The Wipe" Pattern (Multiple destructive keywords in sequence)
    const destructivePattern = /\b(rm|delete|drop|wipe|purge)\b/gi;
    if (command.match(destructivePattern) && this.stats.sensitiveOps > 2) {
      return {
        isAnomalous: true,
        reason: 'Sequential destructive pattern detected.'
      };
    }

    return { isAnomalous: false };
  }

  public getStats(): ActivityStats {
    return { ...this.stats };
  }
}
