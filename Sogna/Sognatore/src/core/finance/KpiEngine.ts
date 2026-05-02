import { FinanceHub, FinanceState } from './FinanceHub.js';

export interface BusinessHealthReport {
    status: 'HEALTHY' | 'CRITICAL' | 'STABLE';
    roi: number;
    burn_rate: number;
    projections: {
        mrr: number;
        arr: number;
    };
}

export class KpiEngine {
    static async generateReport(): Promise<BusinessHealthReport> {
        const hub = FinanceHub.getInstance();
        const state = await hub.getKpis();

        // Business Logic Simulation
        const mrr = 1200; // Monthly Recurring Revenue
        const expenses = state.total_spent;
        
        const roi = expenses > 0 ? (mrr / expenses) : 0;
        
        return {
            status: roi > 2 ? 'HEALTHY' : 'STABLE',
            roi: parseFloat(roi.toFixed(2)),
            burn_rate: expenses,
            projections: {
                mrr,
                arr: mrr * 12
            }
        };
    }
}
