import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface MarketingKPIs {
    reach: number;
    engagement_rate: number;
    conversion_rate: number;
    roi: number;
    sentiment_score: number;
}

export class KPITracker {
    static logEvent(event: string, impact: Partial<MarketingKPIs>) {
        const snap = getTokenGovernanceSnapshot('marketing');
        persistDeptKPI('marketing', { event, impact });
        console.log(
            `[KPI:Tracker] ${event} | Dept tokens: ${snap.departmentTokens} | Budget: ${snap.budgetPercentage}%`,
        );
    }

    static getMonthlyReport() {
        const snap = getTokenGovernanceSnapshot('marketing');
        const health = deriveHealthScore('marketing');
        return {
            status: snap.budgetExceeded ? 'AT_RISK' : health >= 8 ? 'EXCELLENT' : 'GOOD',
            top_performing_agent: snap.departmentAgentCount > 0 ? 'CopyMaster' : '—',
            bottleneck_detected: snap.budgetPercentage > 80 ? 'Token budget pressure' : 'None',
            token_budget_pct: snap.budgetPercentage,
        };
    }
}
