import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface SalesKPIs {
    close_rate: number;
    average_deal_size: number;
    sales_cycle_days: number;
    pipeline_value: number;
    quota_attainment: number;
}

export class SalesKPITracker {
    static async logSalesActivity(activity: string, result: 'WON' | 'LOST' | 'PENDING') {
        const snap = getTokenGovernanceSnapshot('sales');
        persistDeptKPI('sales', { event: 'sales_activity', activity, result });
        console.log(
            `[SalesKPI] ${activity} → ${result} | Dept tokens: ${snap.departmentTokens} | Budget: ${snap.budgetPercentage}%`,
        );
    }

    static getCurrentPipeline() {
        const snap = getTokenGovernanceSnapshot('sales');
        const health = deriveHealthScore('sales');
        return {
            total_leads: Math.round(health * 18),
            qualified_leads: Math.round(health * 5),
            expected_revenue: Math.round(health * 12000),
            token_budget_pct: snap.budgetPercentage,
        };
    }
}
