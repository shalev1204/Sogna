import { EventProvenance, FailureClass, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { EnvOracle } from '../utils/EnvOracle.js';


export interface FinanceState {
    balance: number;
    currency: string;
    total_spent: number;
    last_audit: string;
}

export class FinanceHub {
    private static instance: FinanceHub;
    private bus = SognaEventBus.getInstance();
    
    private constructor() {
        EnvOracle.load();
    }

    static getInstance(): FinanceHub {
        if (!FinanceHub.instance) {
            FinanceHub.instance = new FinanceHub();
        }
        return FinanceHub.instance;
    }

    /**
     * Checks the connection status with financial providers.
     */
    async getStatus(): Promise<Record<string, string>> {
        return {
            stripe: process.env.STRIPE_SECRET_KEY ? 'CONNECTED' : 'NOT_CONFIGURED',
            paypal: process.env.PAYPAL_CLIENT_ID ? 'CONNECTED' : 'NOT_CONFIGURED',
            sogna_credits: 'ACTIVE'
        };
    }

    /**
     * Reports business KPIs.
     */
    async getKpis(): Promise<FinanceState> {
        // Institutional Mock: In a real scenario, this would aggregate data from Stripe/DB
        return {
            balance: 12500.50,
            currency: 'EUR',
            total_spent: 450.25, // Accumulated AI costs
            last_audit: new Date().toISOString()
        };
    }

    /**
     * Records an expense (e.g. AI generation cost).
     */
    recordExpense(amount: number, category: string) {
        this.bus.publish({
            type: SognaEventType.LOG,
            emitter: 'FinanceHub',
            provenance: EventProvenance.LIVE,
            failureClass: FailureClass.NONE,
            data: { message: `Expense recorded: ${amount} in ${category}` }
        });
        // In a real implementation, this updates a database.
    }
}
