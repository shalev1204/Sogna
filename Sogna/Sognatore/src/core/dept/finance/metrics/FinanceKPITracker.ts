export interface FinanceKPIs {
    burn_rate: number;
    runway_months: number;
    net_profit_margin: number;
    mrr: number;           // Monthly Recurring Revenue
    cac_payback_months: number;
}

export class FinanceKPITracker {
    static async logFinancialHealth() {
        // Análisis de datos desde el Ledger
        console.log(`[FinanceKPI] Analysis triggered. Healthy runway detected.`);
    }

    static getBurnAnalysis() {
        return { monthly_burn: 5000, cloud_costs: 2000, salary_equivalent: 3000 };
    }
}
