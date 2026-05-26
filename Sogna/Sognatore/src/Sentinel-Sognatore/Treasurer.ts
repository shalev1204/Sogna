import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ResourcePolicy } from './PolicyTypes.js';
import { Hub } from './Hub.js';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';
import { SecurityAudit } from './SecurityAudit.js';

/**
 * Sentinel Treasurer - Resource and Cost Control system part of the Sentinel-Sognatore block.
 */

const MAX_STATE_ENTRIES = 10000;

export interface TokenUsage {
  agentId?: string;
  model?: string;
  tokens?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface CostProjectEntry {
  agentId: string;
  model: string;
  tokens: number;
  durationMs: number;
  timestamp: string;
  costUsd?: number;
}

export interface HistoryEntry {
  type: 'alert' | 'shutdown' | string;
  timestamp: string;
  threshold?: number;
  percentage?: number;
  projectId?: string;
  reason?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface BudgetAlert {
  threshold: number;
  message: string;
}

export interface BudgetStatus {
  remaining: number;
  percentage: number;
  alerts: BudgetAlert[];
  exceeded: boolean;
}

export interface EfficiencyReport {
  agentId: string;
  avgTokens: number;
  status: 'NEEDS_PRUNING' | 'OPTIMAL';
  recommendation: string;
}

export interface CostState {
  projects: Record<string, { totalTokens: number; totalCostUsd?: number; entries: CostProjectEntry[] }>;
  agents: Record<string, { totalTokens: number; totalCostUsd?: number; model?: string; entries: number }>;
  totalTokens: number;
  totalCostUsd?: number;
  triggeredAlerts: string[];
  history: HistoryEntry[];
}

export interface BudgetConfig {
  maxTokens: number;
  alerts: number[];
  onExceed: 'shutdown' | 'warn';
  name?: string;
}

const USD_RATES: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-latest': { input: 3 / 1000000, output: 15 / 1000000 },
  'claude-3-5-sonnet': { input: 3 / 1000000, output: 15 / 1000000 },
  'sonnet': { input: 3 / 1000000, output: 15 / 1000000 },
  'claude-3-5-haiku-latest': { input: 0.80 / 1000000, output: 4.00 / 1000000 },
  'haiku': { input: 0.80 / 1000000, output: 4.00 / 1000000 },
  'gemini-1.5-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  'gemini-1.5-pro': { input: 1.25 / 1000000, output: 5.00 / 1000000 },
  'deepseek-coder-v2': { input: 0, output: 0 },
  'deepseek-coder-v2:lite': { input: 0, output: 0 },
  'qwen2.5-coder': { input: 0, output: 0 },
  'gemma2': { input: 0, output: 0 },
};

export class Treasurer extends EventEmitter {
  private _projectDir: string;
  private _stateFile: string;
  private _state: CostState;
  private _budgetConfig: BudgetConfig | null;
  private _triggeredAlerts: Set<string> = new Set();
  private _shutdownEmittedProjects: Set<string> = new Set();

  constructor(projectDir?: string, resourcePolicies?: ResourcePolicy[]) {
    super();
    this._projectDir = projectDir || process.cwd();
    this._stateFile = path.join(this._projectDir, '.sognatore', 'state', 'costs.json');
    this._state = this._loadState();
    this._budgetConfig = this._extractBudgetConfig(resourcePolicies || []);

    if (this._state.triggeredAlerts) {
      for (const alert of this._state.triggeredAlerts) {
        this._triggeredAlerts.add(alert);
      }
    }
  }

  private _saveTimer: NodeJS.Timeout | null = null;

  private _loadState(): CostState {
    try {
      if (fs.existsSync(this._stateFile)) {
        const raw = fs.readFileSync(this._stateFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // start fresh
    }
    return {
      projects: {},
      agents: {},
      totalTokens: 0,
      totalCostUsd: 0,
      triggeredAlerts: [],
      history: [],
    };
  }

  /**
   * Requests a state save. Uses a debounce mechanism to avoid blocking the event loop
   * during token usage bursts.
   */
  private _requestSave(): void {
    if (this._saveTimer) return;
    
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.flush();
    }, 2000);
  }

  /**
   * Forces an immediate synchronous save. Used for critical shutdowns or panic modes.
   */
  public flush(): void {
    const dir = path.dirname(this._stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this._state.triggeredAlerts = Array.from(this._triggeredAlerts);
    try {
      fs.writeFileSync(this._stateFile, JSON.stringify(this._state, null, 2), 'utf8');
    } catch (err) {
      console.error('[TREASURER] Error persisting state:', err);
    }
  }

  private _saveState(): void {
    this.flush();
  }

  public destroy(): void {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this.flush();
    this.removeAllListeners();
  }

  private _extractBudgetConfig(resourcePolicies: ResourcePolicy[]): BudgetConfig | null {
    const p = resourcePolicies.find(r => (r as any).max_tokens);
    if (p) {
      return {
        maxTokens: (p as any).max_tokens,
        alerts: (p as any).alerts || [50, 80, 100],
        onExceed: (p as any).on_exceed || 'shutdown',
        name: p.name,
      };
    }

    try {
      const config = ConfigDiscovery.getInstance().getConfig();
      const limits = config.resource_quotas?.budget_limits;
      if (limits) {
        return {
          maxTokens: limits.max_tokens || 1000000,
          alerts: limits.alerts || [50, 80, 100],
          onExceed: limits.on_exceed || 'shutdown',
          name: 'Sogna RC Budget limits'
        };
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  public recordUsage(projectId: string, usage: TokenUsage): void {
    const { agentId, model, tokens, durationMs } = usage || {};
    const tokenCount = tokens || 0;
    const hub = Hub.getInstance();

    // 1. ADAPTIVE WALLET SHIELD (Burst Detection)
    if (this._budgetConfig && tokenCount > 0) {
      const currentBudget = this.checkBudget(projectId);
      const dailyThreshold = this._budgetConfig.maxTokens * 0.3; // 30% of total
      const remainingThreshold = currentBudget.remaining * 0.5; // 50% of remaining

      const isBurst = tokenCount > dailyThreshold || tokenCount > remainingThreshold;

      if (isBurst && !hub.isShieldRelaxed()) {
        const reason = `INTENTO DE WALLET DoS DETECTADO: Ráfaga anómala de ${tokenCount} tokens. ` +
                       `(Umbrales excedidos: Diario=${Math.round(dailyThreshold)}, Restante=${Math.round(remainingThreshold)})`;
        
        hub.reportIntel('CRITICAL', reason, `Treasurer:${agentId || 'unknown'}`);
        
        // Log the incident forensically using SecurityAudit
        SecurityAudit.getInstance(this._projectDir).logDecision(
          'WalletShieldGate',
          'deny',
          reason,
          { agentId: agentId || 'unknown', tokens: tokenCount, projectId }
        );

        // Trigger System Panic (SIGKILL process if PID is available)
        // Note: Usage data usually doesn't carry PID directly, but the Hub can infer it if the agent is registered.
        hub.triggerPanic(reason, 'Wallet Shield');
        return; // Stop processing this usage to avoid further state corruption
      }
    }

    // Calculate USD Cost
    let costUsd = 0;
    const modelLower = (model || 'unknown').toLowerCase();
    const isLocal = modelLower.includes('ollama') || 
                    modelLower.includes('local') || 
                    modelLower.includes('deepseek') || 
                    modelLower.includes('qwen') || 
                    modelLower.includes('gemma') ||
                    modelLower.includes('llama');
    
    if (!isLocal) {
      let rate = USD_RATES['claude-3-5-sonnet-latest'];
      if (modelLower.includes('sonnet')) {
        rate = USD_RATES['claude-3-5-sonnet-latest'];
      } else if (modelLower.includes('haiku')) {
        rate = USD_RATES['claude-3-5-haiku-latest'];
      } else if (modelLower.includes('flash')) {
        rate = USD_RATES['gemini-1.5-flash'];
      } else if (modelLower.includes('pro')) {
        rate = USD_RATES['gemini-1.5-pro'];
      }
      
      const input = usage.inputTokens || Math.round(tokenCount * 0.7);
      const output = usage.outputTokens || Math.round(tokenCount * 0.3);
      costUsd = (input * rate.input) + (output * rate.output);
    }

    if (!this._state.projects[projectId]) {
      this._state.projects[projectId] = { totalTokens: 0, totalCostUsd: 0, entries: [] };
    }
    this._state.projects[projectId].totalTokens += tokenCount;
    this._state.projects[projectId].totalCostUsd = (this._state.projects[projectId].totalCostUsd || 0) + costUsd;
    this._state.projects[projectId].entries.push({
      agentId: agentId || 'unknown',
      model: model || 'unknown',
      tokens: tokenCount,
      durationMs: durationMs || 0,
      timestamp: new Date().toISOString(),
      costUsd
    });

    if (this._state.projects[projectId].entries.length > 100) {
      this._state.projects[projectId].entries.splice(0, this._state.projects[projectId].entries.length - 100);
    }

    const agentKey = agentId || 'unknown';
    if (!this._state.agents[agentKey]) {
      this._state.agents[agentKey] = { totalTokens: 0, totalCostUsd: 0, model, entries: 0 };
    }
    this._state.agents[agentKey].totalTokens += tokenCount;
    this._state.agents[agentKey].totalCostUsd = (this._state.agents[agentKey].totalCostUsd || 0) + costUsd;
    this._state.agents[agentKey].entries += 1;

    this._state.totalTokens += tokenCount;
    this._state.totalCostUsd = (this._state.totalCostUsd || 0) + costUsd;
    this._checkAlerts(projectId);
    this._requestSave();
  }

  public checkBudget(projectId?: string): BudgetStatus {
    if (!this._budgetConfig) {
      return { remaining: Infinity, percentage: 0, alerts: [], exceeded: false };
    }

    const consumed = projectId && this._state.projects[projectId]
      ? this._state.projects[projectId].totalTokens
      : this._state.totalTokens;

    const max = this._budgetConfig.maxTokens;
    const percentage = max > 0 ? Math.round((consumed / max) * 100) : 0;
    const remaining = Math.max(0, max - consumed);
    const exceeded = consumed >= max;

    const alerts: BudgetAlert[] = [];
    for (const threshold of this._budgetConfig.alerts) {
      if (percentage >= threshold) {
        alerts.push({
          threshold,
          message: `Token usage at ${percentage}% (threshold: ${threshold}%)`,
        });
      }
    }

    return { remaining, percentage, alerts, exceeded };
  }

  private _checkAlerts(projectId: string): void {
    if (!this._budgetConfig) return;

    const budget = this.checkBudget(projectId);
    const hub = Hub.getInstance();

    for (const threshold of this._budgetConfig.alerts) {
      const key = `${projectId || 'global'}:${threshold}`;
      if (budget.percentage >= threshold && !this._triggeredAlerts.has(key)) {
        this._triggeredAlerts.add(key);
        this._addHistory('alert', { threshold, percentage: budget.percentage, projectId: projectId || 'global' });
        
        hub.reportIntel('WARNING', `Alerta de presupuesto: ${budget.percentage}% alcanzado (Umbral: ${threshold}%)`, 'Treasurer');
        
        this.emit('alert', { threshold, percentage: budget.percentage, projectId, remaining: budget.remaining });
        this.flush(); // Critical alert: Save immediately
      }
    }

    const shutdownKey = projectId || 'global';
    if (budget.exceeded && !this._shutdownEmittedProjects.has(shutdownKey)) {
      if (this._budgetConfig.onExceed === 'shutdown') {
        this._shutdownEmittedProjects.add(shutdownKey);
        this._addHistory('shutdown', { reason: 'Budget exceeded', percentage: budget.percentage, projectId: projectId || 'global' });
        this.flush(); // Critical: Force save before emitting shutdown
        
        hub.reportIntel('CRITICAL', `SHUTDOWN PREVENTIVO: Presupuesto agotado (${budget.percentage}%). Bloqueando operaciones costosas.`, 'Treasurer');

        this.emit('shutdown', {
          reason: 'Token budget exceeded',
          projectId,
          percentage: budget.percentage,
          consumed: this._state.totalTokens,
          max: this._budgetConfig.maxTokens,
        });
      }
    }
  }

  private _addHistory(type: string, data: Partial<HistoryEntry>): void {
    if (this._state.history.length > MAX_STATE_ENTRIES) {
      this._state.history.splice(0, this._state.history.length - MAX_STATE_ENTRIES);
    }
    this._state.history.push({ ...data, type, timestamp: new Date().toISOString() } as HistoryEntry);
  }

  public getAgentReport(): Record<string, { totalTokens: number; model?: string; entries: number }> {
    return { ...this._state.agents };
  }

  public getProjectReport(projectId?: string): Record<string, { totalTokens: number; entries: CostProjectEntry[] }> | { totalTokens: number; entries: CostProjectEntry[] } | null {
    if (projectId) return this._state.projects[projectId] || null;
    return { ...this._state.projects };
  }

  public getHistory(): HistoryEntry[] {
    return [...this._state.history];
  }

  public reset(): void {
    this._state = { projects: {}, agents: {}, totalTokens: 0, triggeredAlerts: [], history: [] };
    this._triggeredAlerts.clear();
    this._shutdownEmittedProjects.clear();
    this.flush();
  }

  /**
   * ADAPTIVE OPTIMIZER: Analyzes token efficiency.
   * Returns a report of agents that are consuming high tokens with low successful frequency.
   */
  public getEfficiencyOptimization(): EfficiencyReport[] {
    const report: EfficiencyReport[] = [];
    for (const [agentId, data] of Object.entries(this._state.agents)) {
      const avgTokens = data.totalTokens / (data.entries || 1);
      const isHighConsumer = avgTokens > 1000; // Threshold for investigation
      
      report.push({
        agentId,
        avgTokens: Math.round(avgTokens),
        status: isHighConsumer ? 'NEEDS_PRUNING' : 'OPTIMAL',
        recommendation: isHighConsumer ? 'Review context fragments and reduce redundant metadata.' : 'No action required.'
      });
    }
    return report;
  }
}
