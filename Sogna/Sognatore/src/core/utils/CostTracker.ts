import { Color } from '@Sogna/Curator';

import fs from 'fs';
import path from 'path';

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  cacheCreationPer1M?: number;
  cacheReadPer1M?: number;
}

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
  private pricing: Record<string, ModelPricing> = {
    // Platinum
    'claude-4.6-opus': { 
      inputPer1M: 15, 
      outputPer1M: 75,
      cacheCreationPer1M: 18.75,
      cacheReadPer1M: 1.50
    },
    'gpt-5.4-o': { inputPer1M: 10, outputPer1M: 30 },
    
    // Gold
    'claude-4.6-sonnet': { 
      inputPer1M: 3, 
      outputPer1M: 15,
      cacheCreationPer1M: 3.75,
      cacheReadPer1M: 0.30
    },
    'gemini-3.1-pro': { inputPer1M: 1.25, outputPer1M: 3.75 },
    
    // Silver (Efficiency)
    'claude-4.6-haiku': { 
      inputPer1M: 0.25, 
      outputPer1M: 1.25,
      cacheCreationPer1M: 0.30,
      cacheReadPer1M: 0.03
    },
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

  public calculateAndReport(
    model: string, 
    inputTokens: number, 
    outputTokens: number, 
    cacheWrite: number = 0, 
    cacheRead: number = 0
  ): number {
    const modelLower = model.toLowerCase();
    
    // Local models are completely free
    const isLocal = modelLower.includes('ollama') || modelLower.includes('local') || 
                    modelLower.includes('deepseek') || modelLower.includes('qwen') || 
                    modelLower.includes('gemma') || modelLower.includes('llama');
    
    let pricing = this.pricing['claude-4.6-sonnet'];
    
    if (isLocal) {
      pricing = { inputPer1M: 0, outputPer1M: 0, cacheCreationPer1M: 0, cacheReadPer1M: 0 };
    } else {
      // Fuzzy key selection
      if (modelLower.includes('opus')) {
        pricing = this.pricing['claude-4.6-opus'];
      } else if (modelLower.includes('haiku')) {
        pricing = this.pricing['claude-4.6-haiku'];
      } else if (modelLower.includes('flash')) {
        pricing = this.pricing['gemini-1.5-flash'];
      } else if (modelLower.includes('pro')) {
        pricing = this.pricing['gemini-3.1-pro'] || this.pricing['claude-4.6-sonnet'];
      } else if (modelLower.includes('mini')) {
        pricing = this.pricing['gpt-4o-mini'];
      }
    }
    
    const standardCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
    const cacheWriteCost = (cacheWrite / 1_000_000) * (pricing.cacheCreationPer1M || pricing.inputPer1M * 1.25);
    const cacheReadCost = (cacheRead / 1_000_000) * (pricing.cacheReadPer1M || pricing.inputPer1M * 0.1);

    const cost = standardCost + outputCost + cacheWriteCost + cacheReadCost;

    this.sessionCost += cost;
    this.logTaskCost({
      model,
      inputTokens,
      outputTokens,
      cacheCreationTokens: cacheWrite,
      cacheReadTokens: cacheRead,
      cost,
      timestamp: new Date().toISOString()
    });

    const cachingInfo = cacheRead > 0 ? Color.green(` (Caché Hit: ${cacheRead})`) : '';
    console.log(
      Color.cyan(`[💰 ECONOMÍA] `) + 
      Color.white(`Tarea completada con `) + 
      Color.yellow(model) + 
      Color.white(` | Coste: `) + 
      Color.green(`$${cost.toFixed(4)}`) + cachingInfo +
      Color.white(` | Sesión: `) + 
      Color.bold.green(`$${this.sessionCost.toFixed(4)}`)
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
