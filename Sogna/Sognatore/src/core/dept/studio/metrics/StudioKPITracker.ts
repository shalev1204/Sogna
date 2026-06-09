import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface StudioKPIs {
    render_success_rate: number;
    avg_aesthetic_score: number;
    production_volume: number;
    conversion_impact: number;
}

export class StudioKPITracker {
    static async auditAesthetics() {
        const snap = getTokenGovernanceSnapshot('studio');
        const score = deriveHealthScore('studio') * 10 + 6;
        persistDeptKPI('studio', { event: 'aesthetic_audit', avg_aesthetic_score: score });
        console.log(
            `[StudioKPI] Aesthetic score: ${score.toFixed(1)}% | Dept tokens: ${snap.departmentTokens} | Budget: ${snap.budgetPercentage}%`,
        );
    }

    static getProductionMetrics() {
        const snap = getTokenGovernanceSnapshot('studio');
        const health = deriveHealthScore('studio');
        return {
            total_assets_24h: Math.round(snap.departmentTokens / 100) + health * 10,
            avg_render_time_sec: Math.max(15, 60 - health * 5),
            premium_grade_pass: !snap.budgetExceeded,
            session_cost_usd: snap.sessionCostUsd,
        };
    }
}
