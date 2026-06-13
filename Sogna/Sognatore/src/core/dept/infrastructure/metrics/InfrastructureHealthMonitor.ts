import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface InfrastructureKPIs {
    uptime_percentage: number;
    resource_latency_ms: number;
    intelligence_density: number;
    provisioning_speed_sec: number;
    redundancy_level: number;
}

export class InfrastructureHealthMonitor {
    static async performHealthCheck() {
        const snap = getTokenGovernanceSnapshot('infrastructure');
        persistDeptKPI('infrastructure', { event: 'health_check', status: snap.budgetExceeded ? 'DEGRADED' : 'ONLINE' });
        console.log(
            `[InfraHealth] Budget ${snap.budgetPercentage}% | Dept tokens: ${snap.departmentTokens} | Status: ${snap.budgetExceeded ? 'DEGRADED' : 'ONLINE'}`,
        );
    }

    static getCapacityReport() {
        const snap = getTokenGovernanceSnapshot('infrastructure');
        const health = deriveHealthScore('infrastructure');
        return {
            total_gpus: Math.max(1, snap.departmentAgentCount * 2),
            active_clusters: snap.departmentAgentCount,
            storage_usage: `${Math.min(99, snap.budgetPercentage)}%`,
            avg_intelligence: health,
            session_cost_usd: snap.sessionCostUsd,
        };
    }
}
