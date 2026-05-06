import { SwarmBase } from '../../swarms/SwarmBase.js';
import { SuccessManager } from './agents/SuccessManager.js';
import { SupportLead } from './agents/SupportLead.js';
import { LoyaltyArchitect } from './agents/LoyaltyArchitect.js';
import { DataEnricher } from './agents/DataEnricher.js';
import { CRMSpecialist } from './agents/CRMSpecialist.js';
import { CRMKPITracker } from './metrics/CRMKPITracker.js';

export class CRMSwarm extends SwarmBase {
    private success = new SuccessManager();
    private support = new SupportLead();
    private loyalty = new LoyaltyArchitect();
    private enricher = new DataEnricher();
    private specialist = new CRMSpecialist();

    constructor() {
        super('CRMDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.success);
        this.addAgent(this.support);
        this.addAgent(this.loyalty);
        this.addAgent(this.enricher);
        this.addAgent(this.specialist);
    }

    async execute(task: string): Promise<any> {
        console.log(`[CRMSwarm] Managing relationship event: ${task}`);
        
        // Flujo RARV de CRM
        const enrichment = await this.enricher.think(task);
        const resolution = await this.support.think(task);
        const expansion = await this.specialist.think(task);
        
        await CRMKPITracker.logSupportEvent('AUTO_GEN_ID', 5);
        
        return {
            status: 'STABLE',
            customer_health: 9.0,
            log: [enrichment, resolution, expansion]
        };
    }
}
