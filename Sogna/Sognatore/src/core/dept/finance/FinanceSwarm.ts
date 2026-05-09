import { SwarmBase } from '../../swarms/SwarmBase.js';
import { BillingAutomator } from './agents/BillingAutomator.js';
import { CostOptimizer } from './agents/CostOptimizer.js';
import { TreasuryLead } from './agents/TreasuryLead.js';
import { PredatoreController } from './agents/PredatoreController.js';
import { FinanceOrchestrator } from './agents/FinanceOrchestrator.js';
import { FinanceKPITracker } from './metrics/FinanceKPITracker.js';

export class Financeswarm extends SwarmBase {
    private billing = new BillingAutomator();
    private optimizer = new CostOptimizer();
    private treasury = new TreasuryLead();
    private audit = new PredatoreController();
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
        console.log(`[Financeswarm] Processing financial event: ${task}`);
        
        // Flujo Cycle de Finance
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
