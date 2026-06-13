import { InstitutionalAegis } from '../protection/InstitutionalAegis.js';
import { GlobalMemory } from '../brain/GlobalMemory.js';
import { SognaCommBus } from '../brain/SognaBroadcaster.js';
import { NeuralRelay, SignalType } from '../brain/NeuralRelay.js';
import { DeptAgentRuntime } from '../dept/DeptAgentRuntime.js';

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
    protected hub = NeuralRelay.getInstance();

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Broadcasts a thought to the institutional system network.
     */
    protected broadcastThought(message: string) {
        this.hub.transmit({
            source: this.name,
            type: SignalType.SYSTEM_THOUGHT,
            payload: { message },
            priority: 1
        });
    }

    addAgent(agent: Agent) {
        const domainThink = agent.think.bind(agent);
        agent.think = async (task: string) => {
            const llmResponse = await DeptAgentRuntime.think(
                {
                    id: agent.id,
                    role: agent.role,
                    specialty: agent.specialty,
                    department: this.name,
                },
                task,
            );
            void domainThink(task).catch(() => undefined);
            return llmResponse;
        };
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



