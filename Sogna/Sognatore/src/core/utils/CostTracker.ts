import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export interface TaskCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: string;
}

export class CostTracker {
  private static instance: CostTracker;
  private pricing: Record<string, ModelPricing> = {
    // Platinum
    'claude-4.6-opus': { inputPer1M: 15, outputPer1M: 75 },
    'gpt-5.4-o': { inputPer1M: 10, outputPer1M: 30 },
    
    // Gold
    'claude-4.6-sonnet': { inputPer1M: 3, outputPer1M: 15 },
    'gemini-3.1-pro': { inputPer1M: 1.25, outputPer1M: 3.75 },
    
    // Silver (Efficiency)
    'claude-4.6-haiku': { inputPer1M: 0.25, outputPer1M: 1.25 },
    'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
    'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 }
  };

  private statsDir: string;
  private sessionCost: number = 0;

  private constructor() {
    this.statsDir = path.join(process.cwd(), '.sognatore', 'stats');
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

  public calculateAndReport(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing[model] || this.pricing['claude-4.6-sonnet']; // Fallback
    const cost = (inputTokens / 1_000_000) * pricing.inputPer1M + 
                 (outputTokens / 1_000_000) * pricing.outputPer1M;

    this.sessionCost += cost;
    this.logTaskCost({
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date().toISOString()
    });

    console.log(
      chalk.cyan(`[💰 ECONOMÍA] `) + 
      chalk.white(`Tarea completada con `) + 
      chalk.yellow(model) + 
      chalk.white(` | Coste: `) + 
      chalk.green(`$${cost.toFixed(4)}`) + 
      chalk.white(` | Sesión: `) + 
      chalk.bold.green(`$${this.sessionCost.toFixed(4)}`)
    );

    return cost;
  }

  private logTaskCost(task: TaskCost) {
    const logFile = path.join(this.statsDir, 'usage_log.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(task) + '\n');
    
    // Update global aggregated stats
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
      } catch (error: unknown) {
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
