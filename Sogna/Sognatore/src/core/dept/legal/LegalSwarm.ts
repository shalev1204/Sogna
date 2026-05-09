import { SwarmBase } from '../../swarms/SwarmBase.js';
import { ComplianceLead } from './agents/ComplianceLead.js';
import { ContractArchitect } from './agents/ContractArchitect.js';
import { IPGuard } from './agents/IPGuard.js';
import { EthicsOfficer } from './agents/EthicsOfficer.js';
import { LegalOrchestrator } from './agents/LegalOrchestrator.js';
import { LegalKPITracker } from './metrics/LegalKPITracker.js';

export class Legalswarm extends SwarmBase {
    private compliance = new ComplianceLead();
    private contracts = new ContractArchitect();
    private ip = new IPGuard();
    private ethics = new EthicsOfficer();
    private orchestrator = new LegalOrchestrator();

    constructor() {
        super('LegalDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.compliance);
        this.addAgent(this.contracts);
        this.addAgent(this.ip);
        this.addAgent(this.ethics);
        this.addAgent(this.orchestrator);
    }

    async execute(task: string): Promise<any> {
        console.log(`[Legalswarm] Auditing legal event: ${task}`);
        
        // Flujo Cycle de Legal
        const audit = await this.compliance.think(task);
        const structure = await this.contracts.think(task);
        const safety = await this.ethics.think(task);
        
        await LegalKPITracker.auditCompliance();
        
        return {
            status: 'PROTECTED',
            compliance_verified: true,
            legal_trail: [audit, structure, safety]
        };
    }
}
