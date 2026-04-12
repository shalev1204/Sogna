import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ResourcePolicy } from './PolicyTypes.js';

/**
 * Sognatore Policy Engine - Cost Control System
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

export class CostController extends EventEmitter {
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

  private _saveState(): void {
    const dir = path.dirname(this._stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this._state.triggeredAlerts = Array.from(this._triggeredAlerts);
    fs.writeFileSync(this._stateFile, JSON.stringify(this._state, null, 2), 'utf8');
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

    const agentKey = agentId || 'unknown';
    if (!this._state.agents[agentKey]) {
      this._state.agents[agentKey] = { totalTokens: 0, model, entries: 0 };
    }
    this._state.agents[agentKey].totalTokens += tokenCount;
    this._state.agents[agentKey].entries += 1;

    this._state.totalTokens += tokenCount;
    this._checkAlerts(projectId);
    this._saveState();
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

    for (const threshold of this._budgetConfig.alerts) {
      const key = `${projectId || 'global'}:${threshold}`;
      if (budget.percentage >= threshold && !this._triggeredAlerts.has(key)) {
        this._triggeredAlerts.add(key);
        this._addHistory('alert', { threshold, percentage: budget.percentage, projectId: projectId || 'global' });
        this.emit('alert', { threshold, percentage: budget.percentage, projectId, remaining: budget.remaining });
      }
    }

    const shutdownKey = projectId || 'global';
    if (budget.exceeded && !this._shutdownEmittedProjects.has(shutdownKey)) {
      if (this._budgetConfig.onExceed === 'shutdown') {
        this._shutdownEmittedProjects.add(shutdownKey);
        this._addHistory('shutdown', { reason: 'Budget exceeded', percentage: budget.percentage, projectId: projectId || 'global' });
        this._saveState();
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
    this._saveState();
  }
}
