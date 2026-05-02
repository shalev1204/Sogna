import { SwarmBase } from '../../swarms/SwarmBase.js';
import { NeuralSignalType } from '../../brain/NeuralRelay.js';
import { BrandArchitect } from './agents/BrandArchitect.js';
import { ContentStrateger } from './agents/ContentStrateger.js';
import { SocialMediaLead } from './agents/SocialMediaLead.js';
import { MarketAnalyst } from './agents/MarketAnalyst.js';
import { CopyMaster } from './agents/CopyMaster.js';

export class MarketingSwarm extends SwarmBase {
    private brandArch = new BrandArchitect();
    private contentStrat = new ContentStrateger();
    private socialLead = new SocialMediaLead();
    private marketAnalyst = new MarketAnalyst();
    private copyMaster = new CopyMaster();

    constructor() {
        super('MarketingDepartment');
        this.initializeAgents();
        this.listenToNeuralNetwork();
    }

    private initializeAgents() {
        this.addAgent(this.brandArch);
        this.addAgent(this.contentStrat);
        this.addAgent(this.socialLead);
        this.addAgent(this.marketAnalyst);
        this.addAgent(this.copyMaster);
    }

    private listenToNeuralNetwork() {
        this.relay.on(NeuralSignalType.MARKETING_DEMAND, async (signal) => {
            console.log(`[MarketingSwarm] Intercepted MARKETING_DEMAND signal. Initiating RARV Cycle...`);
            await this.executeRARV(signal.payload.objective);
        });
    }

    /**
     * RARV Cycle: Recopilación, Análisis, Resolución, Verificación.
     */
    private async executeRARV(objective: string) {
        this.broadcastThought(`Starting RARV Cycle for: ${objective}`);

        // 1. Recopilación (Gathering)
        const competitors = await this.marketAnalyst.scanCompetitors();
        console.log(`[RARV:R] Data gathered. Competitors: ${competitors.length}`);

        // 2. Análisis (Processing)
        const strategy = await this.contentStrat.think(objective);
        const narrative = await this.brandArch.think(objective);
        console.log(`[RARV:A] Analysis complete. Strategy: ${strategy.substring(0, 30)}...`);

        // 3. Resolución (Execution)
        const copy = await this.copyMaster.think(strategy);
        const postStatus = await this.socialLead.schedulePost(copy, 'LinkedIn');
        console.log(`[RARV:R] Execution: ${postStatus}`);

        // 4. Verificación (Validation)
        const qualityCheck = copy.includes('Sogna');
        if (qualityCheck) {
            this.broadcastThought(`RARV Cycle SUCCESS. Campaign live for: ${objective}`);
        } else {
            this.broadcastThought(`RARV Cycle WARNING: Quality check failed. Retrying...`);
        }
    }

    async execute(task: string): Promise<any> {
        return this.executeRARV(task);
    }
}
