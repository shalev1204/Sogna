import * as policies from '../../policies/index.js';
import { CostTracker } from './CostTracker.js';
import { ensureObservability } from '../../observability/bootstrap.js';
import { recordTaskDuration, recordTokensConsumed } from '../../observability/metrics.js';
import { resolveInstitutionalRoot } from './InstitutionalRoot.js';
const PROJECT_ID = 'sogna';
let initialized = false;

export interface TokenUsageRecord {
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  swarm?: string;
  durationMs?: number;
}

function ensurePolicies(): void {
  if (initialized) return;
  policies.init(resolveInstitutionalRoot());
  initialized = true;
}

export function assertBudgetAllowsUsage(): void {
  ensurePolicies();
  const budget = policies.checkBudget(PROJECT_ID);
  if (budget.exceeded) {
    throw new Error(
      `[Treasurer] Presupuesto de tokens agotado (${budget.percentage}%). Operaciones LLM bloqueadas.`,
    );
  }
}

export function recordTokenUsage(usage: TokenUsageRecord): void {
  ensureObservability();
  ensurePolicies();
  const total = usage.inputTokens + usage.outputTokens;

  CostTracker.getInstance().calculateAndReport(
    usage.model,
    usage.inputTokens,
    usage.outputTokens,
  );

  policies.recordUsage(PROJECT_ID, {
    agentId: usage.agentId,
    model: usage.model,
    tokens: total,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    durationMs: usage.durationMs ?? 0,
  });

  recordTokensConsumed(total, usage.model, usage.swarm ?? usage.agentId);

  if (usage.durationMs && usage.durationMs > 0) {
    recordTaskDuration(usage.durationMs / 1000, {
      model: usage.model,
      agent: usage.agentId,
    });
  }
}
export function estimateTokens(charLength: number): number {
  return Math.ceil(charLength / 4);
}

/** Solo para tests: permite re-inicializar policies con otra raíz. */
export function resetPolicyBinding(): void {
  initialized = false;
}
