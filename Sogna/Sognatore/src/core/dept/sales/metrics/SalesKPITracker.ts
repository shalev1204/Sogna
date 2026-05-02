export interface SalesKPIs {
    close_rate: number;
    average_deal_size: number;
    sales_cycle_days: number;
    pipeline_value: number;
    quota_attainment: number;
}

export class SalesKPITracker {
    static async logSalesActivity(activity: string, result: 'WON' | 'LOST' | 'PENDING') {
        console.log(`[SalesKPI] Activity: ${activity} | Result: ${result}`);
        // Integración con el ledger de Finance Hub
    }

    static getCurrentPipeline() {
        return { total_leads: 150, qualified_leads: 45, expected_revenue: 120000 };
    }
}
