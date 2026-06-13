import {
  deriveHealthScore,
  getTokenGovernanceSnapshot,
  persistDeptKPI,
} from '../../metrics/DeptKPISnapshot.js';

export interface CRMKPIs {
    nps: number;
    csat: number;
    resolution_time_hrs: number;
    churn_rate: number;
    expansion_revenue: number;
}

export class CRMKPITracker {
    static async logSupportEvent(ticketId: string, satisfaction: number) {
        const snap = getTokenGovernanceSnapshot('crm');
        persistDeptKPI('crm', { event: 'support', ticketId, satisfaction });
        console.log(
            `[CRM_KPI] Ticket: ${ticketId} | Satisfaction: ${satisfaction} | Dept tokens: ${snap.departmentTokens} | Budget: ${snap.budgetPercentage}%`,
        );
    }

    static getCustomerHealthScore(_customerId: string): number {
        return deriveHealthScore('crm');
    }
}
