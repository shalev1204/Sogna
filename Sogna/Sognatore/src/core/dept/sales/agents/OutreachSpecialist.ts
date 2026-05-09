import { Agent } from '../../../swarms/SwarmBase.js';
import { SalesSkillRegistry } from '../skills/SalesSkillRegistry.js';

export class OutreachSpecialist implements Agent {
    id = 'sales_outreach_spec';
    role = 'Outreach Specialist';
    specialty = 'High-Volume Prospecting & Initial Contact';
    memory: any[] = [];
    
    private skills = SalesSkillRegistry.PROSPECTING;

    async think(task: string): Promise<string> {
        console.log(`[OutreachSpecialist] Initiating contact sequence for: ${task}`);
        return `OUTREACH: Sent institutional sequences using [${this.skills.join(', ')}]. Dream: Meeting booking.`;
    }
}
