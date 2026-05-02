import { Agent } from '../../../swarms/SwarmBase.js';
import { SalesSkillRegistry } from '../skills/SalesSkillRegistry.js';

export class SalesNegotiator implements Agent {
    id = 'sales_negotiator';
    role = 'Sales Negotiator';
    specialty = 'Objection Handling & Price Optimization';
    memory: any[] = [];
    
    private skills = SalesSkillRegistry.NEGOTIATION;

    async think(task: string): Promise<string> {
        console.log(`[SalesNegotiator] Handling objections for: ${task}`);
        return `NEGOTIATION: Applied skills [${this.skills.join(', ')}] to resolve friction in ${task}.`;
    }
}
