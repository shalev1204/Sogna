import fs from 'node:fs';
import path from 'node:path';
import * as policies from '../../../policies/index.js';
import { CostTracker } from '../../utils/CostTracker.js';
import { resolveInstitutionalRoot } from '../../utils/InstitutionalRoot.js';

const PROJECT_ID = 'sogna';

/** Prefijos de agentId por departamento (dept/) */
const DEPT_AGENT_PREFIXES: Record<string, string[]> = {
  crm: ['crm_'],
  finance: ['finance_'],
  growth: ['growth_'],
  infrastructure: ['infra_'],
  legal: ['legal_'],
  marketing: ['marketing_'],
  operations: ['ops_'],
  protection: ['prot_'],
  sales: ['sales_'],
  studio: ['studio_'],
};

export interface TokenGovernanceSnapshot {
  budgetPercentage: number;
  budgetRemaining: number;
  budgetExceeded: boolean;
  globalTokens: number;
  departmentTokens: number;
  departmentAgentCount: number;
  sessionCostUsd: number;
  timestamp: string;
}

let governanceReady = false;

function ensureGovernance(): void {
  if (governanceReady) return;
  policies.init(resolveInstitutionalRoot());
  governanceReady = true;
}

function statsDir(): string {
  const root = resolveInstitutionalRoot();
  const dir = path.join(root, '.sognatore', 'stats', 'dept');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getTokenGovernanceSnapshot(department: string): TokenGovernanceSnapshot {
  ensureGovernance();
  const budget = policies.checkBudget(PROJECT_ID);
  const treasurer = policies.getCostController();
  const agentReport = treasurer?.getAgentReport() ?? {};
  const prefixes = DEPT_AGENT_PREFIXES[department] ?? [`${department}_`];

  let departmentTokens = 0;
  let departmentAgentCount = 0;
  for (const [agentId, data] of Object.entries(agentReport)) {
    if (prefixes.some((p) => agentId.startsWith(p))) {
      departmentTokens += data.totalTokens;
      departmentAgentCount++;
    }
  }

  const project = treasurer?.getProjectReport(PROJECT_ID) as { totalTokens?: number } | null;
  const globalTokens = project?.totalTokens ?? 0;

  return {
    budgetPercentage: budget.percentage,
    budgetRemaining: budget.remaining,
    budgetExceeded: budget.exceeded,
    globalTokens,
    departmentTokens,
    departmentAgentCount,
    sessionCostUsd: CostTracker.getInstance().getSessionCost(),
    timestamp: new Date().toISOString(),
  };
}

export function persistDeptKPI(department: string, payload: Record<string, unknown>): void {
  ensureGovernance();
  const tokenSnapshot = getTokenGovernanceSnapshot(department);
  const file = path.join(statsDir(), `${department}.json`);
  const record = {
    department,
    ...payload,
    token_governance: tokenSnapshot,
    persisted_at: new Date().toISOString(),
  };
  fs.writeFileSync(file, JSON.stringify(record, null, 2), 'utf8');
}

export function readDeptKPI<T = Record<string, unknown>>(department: string): T | null {
  const file = path.join(statsDir(), `${department}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

/** Índice de salud 1–10 derivado de presupuesto institucional + actividad dept */
export function deriveHealthScore(department: string): number {
  const snap = getTokenGovernanceSnapshot(department);
  if (snap.budgetExceeded) return 2;
  let score = 6;
  if (snap.budgetPercentage < 80) score += 2;
  if (snap.departmentAgentCount > 0) score += 1;
  if (snap.departmentTokens > 0 && snap.departmentTokens < 500_000) score += 1;
  return Math.min(10, score);
}
