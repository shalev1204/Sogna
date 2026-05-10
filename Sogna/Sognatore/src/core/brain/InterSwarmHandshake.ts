import { Color, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { MemoryHub } from '../memory/MemoryHub.js';
import { SognaCommBus } from './SognaBroadcaster.js';

/**
 * Inter-Swarm Handshake (ISH)
 * Manages high-level coordination between specialized agent departments.
 */
export class InterSwarmHandshake {
    private static instance: InterSwarmHandshake;
    private bus = SognaEventBus.getInstance();

    private constructor() {}

    public static getInstance(): InterSwarmHandshake {
        if (!InterSwarmHandshake.instance) {
            InterSwarmHandshake.instance = new InterSwarmHandshake();
        }
        return InterSwarmHandshake.instance;
    }

    /**
     * Establishes a logical synchronization between two swarms for a shared task.
     */
    public async establishLink(sourceSwarm: string, targetSwarm: string, context: string): Promise<boolean> {
        console.log(Color.bold.blue(`[ISH] Attempting Synaptic Link: ${sourceSwarm} <-> ${targetSwarm}`));
        
        // 1. Verify target swarm capacity via MemoryHub
        const memory = MemoryHub.getInstance();
        const expertise = await memory.semanticRecall(context);
        const hasCapacity = expertise.some(f => f.metadata.swarm === targetSwarm);

        if (!hasCapacity) {
            console.warn(Color.yellow(`[ISH] Target swarm ${targetSwarm} may lack specific context for this request.`));
        }

        // 2. Dispatch high-level handshake event
        SognaCommBus.handshake(sourceSwarm, targetSwarm, 'SWARM_LOCK', { context, timestamp: Date.now() });

        // 3. Log the connection in the neural network
        memory.registerSynapse(sourceSwarm, targetSwarm, 'INTER_SWARM_COORDINATION');

        this.bus.publish({
            type: SognaEventType.LOG,
            emitter: 'InterSwarmHandshake',
            data: { message: `Neural resonance established between ${sourceSwarm} and ${targetSwarm}.` }
        });

        console.log(Color.green(`[ISH] Synaptic Link Secured: ${sourceSwarm} <-> ${targetSwarm}`));
        return true;
    }

    /**
     * Synchronizes critical data across department boundaries.
     */
    public async syncContext(key: string, data: any): Promise<void> {
        SognaCommBus.synapticSync('ISH_Controller', key, data);
        console.log(Color.dim(`[ISH] Global context sync triggered: ${key}`));
    }
}
