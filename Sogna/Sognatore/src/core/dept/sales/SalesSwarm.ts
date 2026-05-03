import { SwarmBase } from '../../swarms/swarmbase.js';
import { OutreachSpecialist } from './agents/outreachspecialist.js';
import { LeadQualifier } from './agents/leadqualifier.js';
import { DealArchitect } from './agents/dealarchitect.js';
import { SalesNegotiator } from './agents/salesnegotiator.js';
import { SalesOrchestrator } from './agents/salesorchestrator.js';
import { SalesKPITracker } from './metrics/saleskpitracker.js';

export class SalesSwarm extends SwarmBase {
    private outreach = new OutreachSpecialist();
    private qualifier = new LeadQualifier();
    private architect = new DealArchitect();
    private negotiator = new SalesNegotiator();
    private closer = new SalesOrchestrator();

    constructor() {
        super('SalesDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.outreach);
        this.addAgent(this.qualifier);
        this.addAgent(this.architect);
        this.addAgent(this.negotiator);
        this.addAgent(this.closer);
    }

    async execute(task: string): Promise<any> {
        console.log(`[SalesSwarm] Processing deal pipeline: ${task}`);
        
        // Flujo RARV de Ventas
        const qual = await this.qualifier.think(task);
        const proposal = await this.architect.think(task);
        const handshake = await this.closer.think(task);
        
        await SalesKPITracker.logSalesActivity(task, 'WON');
        
        return {
            deal_status: 'CLOSED_WON',
            history: [qual, proposal, handshake]
        };
    }
}
