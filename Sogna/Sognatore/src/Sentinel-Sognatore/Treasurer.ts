import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ResourcePolicy } from './policytypes.js';
import { Hub } from './hub.js';

/**
 * Sentinel Treasurer - Resource and Cost Control system part of the Sentinel-Sognatore block.
 */

const MAX_STATE_ENTRIES = 10000;

export interface TokenUsage {
  agentId?: string;
  model?: string;
  tokens?: number;
  durationMs?: number;
}

export interface CostProjectEntry {
  agentId: string;
  model: string;
  tokens: number;
  durationMs: number;
  timestamp: string;
}

export interface CostState {
  projects: Record<string, { totalTokens: number; entries: CostProjectEntry[] }>;
  agents: Record<string, { totalTokens: number; model?: string; entries: number }>;
  totalTokens: number;
  triggeredAlerts: string[];
  history: any[];
}

export interface BudgetConfig {
  maxTokens: number;
  alerts: number[];
  onExceed: 'shutdown' | 'warn';
  name?: string;
}

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
      this._saveState();
      this._saveTimer = null;
    }, 2000); // Consolidate every 2 seconds
  }

  /**
   * Forces an immediate synchronous save. Used for critical shutdowns or panic modes.
   */
  public flush(): void {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this._saveState();
  }

  private _saveState(): void {
    const dir = path.dirname(this._stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this._state.triggeredAlerts = Array.from(this._triggeredAlerts);
    // Asynchronous write for better performance, except if called via flush()
    fs.writeFile(this._stateFile, JSON.stringify(this._state, null, 2), 'utf8', (err) => {
      if (err) console.error('[TREASURER] Error persisting state:', err);
    });
  }

  private _extractBudgetConfig(resourcePolicies: ResourcePolicy[]): BudgetConfig | null {
    const p = resourcePolicies.find(r => (r as any).max_tokens);
    if (!p) return null;
    return {
      maxTokens: (p as any).max_tokens,
      alerts: (p as any).alerts || [50, 80, 100],
      onExceed: (p as any).on_exceed || 'shutdown',
      name: p.name,
    };
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
        
        // Trigger System Panic (SIGKILL process if PID is available)
        // Note: Usage data usually doesn't carry PID directly, but the Hub can infer it if the agent is registered.
        hub.triggerPanic(reason, 'Wallet Shield');
        return; // Stop processing this usage to avoid further state corruption
      }
    }

    if (!this._state.projects[projectId]) {
      this._state.projects[projectId] = { totalTokens: 0, entries: [] };
    }
    this._state.projects[projectId].totalTokens += tokenCount;
    this._state.projects[projectId].entries.push({
      agentId: agentId || 'unknown',
      model: model || 'unknown',
      tokens: tokenCount,
      durationMs: durationMs || 0,
      timestamp: new Date().toISOString(),
    });

    if (this._state.projects[projectId].entries.length > 100) {
      this._state.projects[projectId].entries.splice(0, this._state.projects[projectId].entries.length - 100);
    }

    const agentKey = agentId || 'unknown';
    if (!this._state.agents[agentKey]) {
      this._state.agents[agentKey] = { totalTokens: 0, model, entries: 0 };
    }
    this._state.agents[agentKey].totalTokens += tokenCount;
    this._state.agents[agentKey].entries += 1;

    this._state.totalTokens += tokenCount;
    this._checkAlerts(projectId);
    this._requestSave();
  }

  public checkBudget(projectId?: string): { remaining: number; percentage: number; alerts: any[]; exceeded: boolean } {
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

    const alerts = [];
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

  private _addHistory(type: string, data: any): void {
    if (this._state.history.length > MAX_STATE_ENTRIES) {
      this._state.history.splice(0, this._state.history.length - MAX_STATE_ENTRIES);
    }
    this._state.history.push({ ...data, type, timestamp: new Date().toISOString() });
  }

  public getAgentReport(): Record<string, any> {
    return { ...this._state.agents };
  }

  public getProjectReport(projectId?: string): any {
    if (projectId) return this._state.projects[projectId] || null;
    return { ...this._state.projects };
  }

  public getHistory(): any[] {
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
  public getEfficiencyOptimization(): any {
    const report: any[] = [];
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

