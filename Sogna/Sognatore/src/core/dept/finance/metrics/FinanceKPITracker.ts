import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';
import * as policies from '../../../../policies/index.js';

export interface FinanceKPIs {
    burn_rate: number;
    runway_months: number;
    net_profit_margin: number;
    mrr: number;
    cac_payback_months: number;
}

export class FinanceKPITracker {
    static async logFinancialHealth() {
        const snap = getTokenGovernanceSnapshot('finance');
        const treasurer = policies.getCostController();
        const agentReport = treasurer?.getAgentReport() ?? {};
        persistDeptKPI('finance', {
            event: 'financial_health',
            agents_tracked: Object.keys(agentReport).length,
        });
        console.log(
            `[FinanceKPI] Token budget ${snap.budgetPercentage}% | Agents tracked: ${Object.keys(agentReport).length} | Remaining: ${snap.budgetRemaining}`,
        );
    }

    static getBurnAnalysis() {
        const snap = getTokenGovernanceSnapshot('finance');
        const tokens = snap.departmentTokens || snap.globalTokens;
        return {
            monthly_burn: Math.round(tokens / 1000),
            cloud_costs: Math.round(tokens * 0.4 / 1000),
            salary_equivalent: Math.round(tokens * 0.6 / 1000),
            token_budget_pct: snap.budgetPercentage,
            session_cost_usd: snap.sessionCostUsd,
        };
    }

    static getInstitutionalHealthScore(): number {
        return deriveHealthScore('finance');
    }
}
