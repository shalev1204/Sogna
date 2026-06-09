import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface GrowthKPIs {
    ltv: number;
    cac: number;
    churn_rate: number;
    viral_coefficient: number;
    nps: number;
}

export class GrowthKPITracker {
    static async logGrowthMetric(metric: keyof GrowthKPIs, value: number) {
        const snap = getTokenGovernanceSnapshot('growth');
        persistDeptKPI('growth', { event: 'metric', metric, value });
        console.log(
            `[GrowthKPI] ${metric}=${value} | Dept tokens: ${snap.departmentTokens} | Budget: ${snap.budgetPercentage}%`,
        );
    }

    static getGrowthHealth(): 'EXPANDING' | 'STAGNANT' | 'CRITICAL' {
        const snap = getTokenGovernanceSnapshot('growth');
        if (snap.budgetExceeded) return 'CRITICAL';
        if (snap.budgetPercentage >= 85) return 'STAGNANT';
        return 'EXPANDING';
    }

    static getHealthScore(): number {
        return deriveHealthScore('growth');
    }
}
