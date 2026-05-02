import { InstitutionalAegis } from '../protection/InstitutionalAegis.js';
import { GlobalMemory } from '../brain/GlobalMemory.js';
import { SognaCommBus } from '../brain/CorporateBroadcaster.js';

export interface Agent {
    id: string;
    role: string;
    specialty: string;
    memory: any[];
    think: (task: string) => Promise<string>;
}

export abstract class SwarmBase {
    protected agents: Agent[] = [];
    protected name: string;
    protected memory = GlobalMemory.getInstance();
    protected comms = SognaCommBus;

    constructor(name: string) {
        this.name = name;
    }

    addAgent(agent: Agent) {
        this.agents.push(agent);
    }

    /**
     * Valida y ejecuta una tarea bajo el estándar institucional.
     */
    async process(task: string): Promise<any> {
        // [R]ecopilation & Verification (Aegis)
        const isSafe = await InstitutionalAegis.validateOperation(this.name, task);
        if (!isSafe) return { status: 'DENIED', reason: 'Security Violation' };

        // [A]nalysis & [R]esolution
        const result = await this.execute(task);

        // [V]erification & Persistence
        this.memory.store({
            department: this.name,
            topic: task.substring(0, 50),
            content: result,
            confidence: 0.95
        });

        InstitutionalAegis.logForensics(this.name, result);
        
        return result;
    }

    /**
     * Ejecuta el pensamiento de todos los agentes en paralelo para una resolución rápida.
     */
    protected async thinkAll(task: string): Promise<string[]> {
        return Promise.all(this.agents.map(agent => agent.think(task)));
    }

    protected abstract execute(task: string): Promise<any>;
}



