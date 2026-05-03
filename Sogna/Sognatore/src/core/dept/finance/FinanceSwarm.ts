import { SwarmBase } from '../../swarms/swarmbase.js';
import { BillingAutomator } from './agents/billingautomator.js';
import { CostOptimizer } from './agents/costoptimizer.js';
import { TreasuryLead } from './agents/treasurylead.js';
import { AuditController } from './agents/auditcontroller.js';
import { FinanceOrchestrator } from './agents/financeorchestrator.js';
import { FinanceKPITracker } from './metrics/financekpitracker.js';

export class FinanceSwarm extends SwarmBase {
    private billing = new BillingAutomator();
    private optimizer = new CostOptimizer();
    private treasury = new TreasuryLead();
    private audit = new AuditController();
    private orchestrator = new FinanceOrchestrator();

    constructor() {
        super('FinanceDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.billing);
        this.addAgent(this.optimizer);
        this.addAgent(this.treasury);
        this.addAgent(this.audit);
        this.addAgent(this.orchestrator);
    }

    async execute(task: string): Promise<any> {
        console.log(`[FinanceSwarm] Processing financial event: ${task}`);
        
        // Flujo RARV de Finance
        const plan = await this.orchestrator.think(task);
        const bill = await this.billing.think(task);
        const verification = await this.audit.think(task);
        
        await FinanceKPITracker.logFinancialHealth();
        
        return {
            status: 'SOLVENT',
            treasury_report: await this.treasury.think(task),
            history: [plan, bill, verification]
        };
    }
}
