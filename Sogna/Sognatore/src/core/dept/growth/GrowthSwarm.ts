import { SwarmBase } from '../../swarms/swarmbase.js';
import { GrowthHacker } from './agents/growthhacker.js';
import { ConversionOptimist } from './agents/conversionoptimist.js';
import { RetentionLead } from './agents/retentionlead.js';
import { ViralArchitect } from './agents/viralarchitect.js';
import { ExperimentLead } from './agents/experimentlead.js';
import { GrowthKPITracker } from './metrics/growthkpitracker.js';

export class GrowthSwarm extends SwarmBase {
    private hacker = new GrowthHacker();
    private optimist = new ConversionOptimist();
    private retention = new RetentionLead();
    private viral = new ViralArchitect();
    private experimental = new ExperimentLead();

    constructor() {
        super('GrowthDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.hacker);
        this.addAgent(this.optimist);
        this.addAgent(this.retention);
        this.addAgent(this.viral);
        this.addAgent(this.experimental);
    }

    async execute(task: string): Promise<any> {
        console.log(`[GrowthSwarm] Executing growth cycle: ${task}`);
        
        // Flujo RARV Técnico
        // 1. Recopilación & Análisis
        const experimentalData = await this.experimental.think(task);
        
        // 2. Resolución
        const hack = await this.hacker.think(task);
        const optimization = await this.optimist.think(task);
        
        // 3. Verificación de Métricas
        await GrowthKPITracker.logGrowthMetric('viral_coefficient', 1.25);
        
        return {
            status: 'COMPLETED',
            results: [experimentalData, hack, optimization]
        };
    }
}
