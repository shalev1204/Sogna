import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface LegalKPIs {
    compliance_score: number;
    ip_assets_secured: number;
    contract_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    gdpr_audit_status: 'PASSED' | 'PENDING' | 'FAILED';
}

export class LegalKPITracker {
    static async auditCompliance() {
        const snap = getTokenGovernanceSnapshot('legal');
        const score = Math.max(0, 100 - snap.budgetPercentage);
        persistDeptKPI('legal', { event: 'compliance_audit', compliance_score: score });
        console.log(
            `[LegalKPI] Compliance score: ${score}/100 | Budget: ${snap.budgetPercentage}% | Dept tokens: ${snap.departmentTokens}`,
        );
    }

    static getIPStatus() {
        const snap = getTokenGovernanceSnapshot('legal');
        return {
            total_copyrights: snap.departmentAgentCount * 9,
            patents_pending: snap.budgetExceeded ? 2 : 0,
            trademark_status: snap.budgetExceeded ? 'REVIEW' : 'ACTIVE',
        };
    }

    static getComplianceScore(): number {
        return deriveHealthScore('legal') * 10;
    }
}
