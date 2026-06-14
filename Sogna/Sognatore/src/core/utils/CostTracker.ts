import { Color } from '@Sogna/Curator';

import fs from 'fs';
import path from 'path';
import {
  calculateTokenCost,
  type ModelPricingEntry,
} from '../pricing/ModelPricingCatalog.js';
import { resolveInstitutionalRoot } from './InstitutionalRoot.js';

export type { ModelPricingEntry };

export interface TaskCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  cost: number;
  timestamp: string;
}

export class CostTracker {
  private static instance: CostTracker;
  private statsDir: string;
  private sessionCost: number = 0;

  private constructor() {
    const sognaRoot = resolveInstitutionalRoot();
    this.statsDir = path.join(sognaRoot, '.sognatore', 'stats');
    if (!fs.existsSync(this.statsDir)) {
      fs.mkdirSync(this.statsDir, { recursive: true });
    }
  }

  static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  public calculateAndReport(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cacheWrite: number = 0,
    cacheRead: number = 0,
  ): number {
    const cost = calculateTokenCost(model, inputTokens, outputTokens, cacheWrite, cacheRead);

    this.sessionCost += cost;
    this.logTaskCost({
      model,
      inputTokens,
      outputTokens,
      cacheCreationTokens: cacheWrite,
      cacheReadTokens: cacheRead,
      cost,
      timestamp: new Date().toISOString(),
    });

    const cachingInfo = cacheRead > 0 ? Color.green(` (Caché Hit: ${cacheRead})`) : '';
    console.log(
      Color.cyan(`[💰 ECONOMÍA] `) +
      Color.white(`Tarea completada con `) +
      Color.yellow(model) +
      Color.white(` | Coste: `) +
      Color.green(`$${cost.toFixed(4)}`) + cachingInfo +
      Color.white(` | Sesión: `) +
      Color.bold.green(`$${this.sessionCost.toFixed(4)}`),
    );

    return cost;
  }

  private logTaskCost(task: TaskCost) {
    const logFile = path.join(this.statsDir, 'usage_log.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(task) + '\n');

    const globalStatsFile = path.join(this.statsDir, 'global_stats.json');
    interface GlobalStats {
      totalCost: number;
      totalTasks: number;
      models: Record<string, number>;
    }
    let stats: GlobalStats = { totalCost: 0, totalTasks: 0, models: {} };

    if (fs.existsSync(globalStatsFile)) {
      try {
        stats = JSON.parse(fs.readFileSync(globalStatsFile, 'utf8')) as GlobalStats;
      } catch {
        console.error('[COST] Failed to parse global stats, resetting...');
      }
    }

    stats.totalCost += task.cost;
    stats.totalTasks += 1;
    stats.models[task.model] = (stats.models[task.model] || 0) + 1;

    fs.writeFileSync(globalStatsFile, JSON.stringify(stats, null, 2));
  }

  public getSessionCost(): number {
    return this.sessionCost;
  }
}
