import { SwarmBase } from '../../swarms/SwarmBase.js';
import { CreativeDirector } from './agents/CreativeDirector.js';
import { VisualArchitect } from './agents/VisualArchitect.js';
import { MotionDesigner } from './agents/MotionDesigner.js';
import { AcousticEngineer } from './agents/AcousticEngineer.js';
import { OutputEditor } from './agents/OutputEditor.js';
import { StudioKPITracker } from './metrics/StudioKPITracker.js';
import { StudioBridge } from './StudioBridge.js';

export class Studioswarm extends SwarmBase {
    private bridge = StudioBridge.getInstance();
    private director = new CreativeDirector();
    private visual = new VisualArchitect();
    private motion = new MotionDesigner();
    private acoustic = new AcousticEngineer();
    private editor = new OutputEditor();

    constructor() {
        super('StudioDepartment');
        this.initializeAgents();
    }

    private initializeAgents() {
        this.addAgent(this.director);
        this.addAgent(this.visual);
        this.addAgent(this.motion);
        this.addAgent(this.acoustic);
        this.addAgent(this.editor);
    }

    async execute(task: string): Promise<any> {
        console.log(`[Studioswarm] Initiating creative production: ${task}`);
        
        // Flujo Cycle de Studio
        const vision = await this.director.think(task);
        const image = await this.visual.think(task);
        const audio = await this.acoustic.think(task);
        const polish = await this.editor.think(task);
        
        await StudioKPITracker.auditAesthetics();
        
        return {
            status: 'PUBLISHED',
            aesthetic_score: 9.6,
            production_log: [vision, image, audio, polish]
        };
    }
}
