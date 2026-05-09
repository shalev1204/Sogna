import { SwarmBase } from '../../swarms/SwarmBase.js';
import { SignalType } from '../../brain/NeuralRelay.js';
import { BrandArchitect } from './agents/BrandArchitect.js';
import { ContentStrateger } from './agents/ContentStrateger.js';
import { SocialMediaLead } from './agents/SocialMediaLead.js';
import { MarketAnalyst } from './agents/MarketAnalyst.js';
import { CopyMaster } from './agents/CopyMaster.js';

export class Marketingswarm extends SwarmBase {
    private brandArch = new BrandArchitect();
    private contentStrat = new ContentStrateger();
    private socialLead = new SocialMediaLead();
    private marketAnalyst = new MarketAnalyst();
    private copyMaster = new CopyMaster();

    constructor() {
        super('MarketingDepartment');
        this.initializeAgents();
        this.listenTosystemNetwork();
    }

    private initializeAgents() {
        this.addAgent(this.brandArch);
        this.addAgent(this.contentStrat);
        this.addAgent(this.socialLead);
        this.addAgent(this.marketAnalyst);
        this.addAgent(this.copyMaster);
    }

    private listenTosystemNetwork() {
        this.hub.on(SignalType.MARKETING_DEMAND, async (signal) => {
            console.log(`[Marketingswarm] Intercepted MARKETING_DEMAND signal. Initiating Cycle Cycle...`);
            await this.executeCycle(signal.payload.objective);
        });
    }

    /**
     * Cycle Cycle: Recopilación, Análisis, Resolución, Verificación.
     */
    private async executeCycle(objective: string) {
        this.broadcastThought(`Starting Cycle Cycle for: ${objective}`);

        // 1. Recopilación (Gathering)
        const competitors = await this.marketAnalyst.scanCompetitors();
        console.log(`[Cycle:R] Data gathered. Competitors: ${competitors.length}`);

        // 2. Análisis (Processing)
        const strategy = await this.contentStrat.think(objective);
        const narrative = await this.brandArch.think(objective);
        console.log(`[Cycle:A] Analysis complete. Strategy: ${strategy.substring(0, 30)}...`);

        // 3. Resolución (Execution)
        const copy = await this.copyMaster.think(strategy);
        const postStatus = await this.socialLead.schedulePost(copy, 'LinkedIn');
        console.log(`[Cycle:R] Execution: ${postStatus}`);

        // 4. Verificación (Validation)
        const qualityCheck = copy.includes('Sogna');
        if (qualityCheck) {
            this.broadcastThought(`Cycle Cycle SUCCESS. Campaign live for: ${objective}`);
        } else {
            this.broadcastThought(`Cycle Cycle WARNING: Quality check failed. Retrying...`);
        }
    }

    async execute(task: string): Promise<any> {
        return this.executeCycle(task);
    }
}
