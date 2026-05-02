import { Agent } from '../../../swarms/SwarmBase.js';
import { SalesSkillRegistry } from '../skills/SalesSkillRegistry.js';

export class LeadQualifier implements Agent {
    id = 'sales_lead_qual';
    role = 'Lead Qualifier';
    specialty = 'BANT Analysis & Technical Viability';
    memory: any[] = [];
    
    private skills = SalesSkillRegistry.CRM;

    async think(task: string): Promise<string> {
        console.log(`[LeadQualifier] Qualifying lead: ${task}`);
        return `QUALIFICATION: Lead scored using [${this.skills.join(', ')}]. Priority: High.`;
    }
}
