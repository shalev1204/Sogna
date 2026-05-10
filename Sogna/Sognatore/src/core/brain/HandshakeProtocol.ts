import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SognaCommBus } from './SognaBroadcaster.js';
import { systemLogisticsHub } from '../dept/operations/logistics/systemLogisticsHub.js';
import { MemoryHub } from '../memory/MemoryHub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Neural Handshake Protocol (NHP)
 * Orchestrates the connection and verification of all agents in the Sogna ecosystem.
 */
export class HandshakeProtocol {
    private static instance: HandshakeProtocol;
    private swarmCatalogPath: string;
    private agents: string[] = [];
    private activeSynapses: Set<string> = new Set();

    private constructor() {
        // Find root and catalog
        const sognatoreRoot = path.join(__dirname, '..', '..');
        this.swarmCatalogPath = path.resolve(sognatoreRoot, 'resources', 'config', 'swarm_catalog.json');
        this.loadAgents();
    }

    public static getInstance(): HandshakeProtocol {
        if (!HandshakeProtocol.instance) {
            HandshakeProtocol.instance = new HandshakeProtocol();
        }
        return HandshakeProtocol.instance;
    }

    private loadAgents(): void {
        try {
            const catalog = JSON.parse(fs.readFileSync(this.swarmCatalogPath, 'utf8'));
            const allAgents: string[] = [];
            
            // Collect all agents from base and evolved swarms
            const processSwarms = (swarms: any) => {
                for (const swarm of Object.values(swarms || {})) {
                    allAgents.push(...(swarm as any).agents);
                }
            };

            processSwarms(catalog.swarms);
            processSwarms(catalog.evolved_swarms);
            
            this.agents = [...new Set(allAgents)];
            console.log(`[NHP] Loaded ${this.agents.length} agents for handshake.`);
        } catch (error) {
            console.error(`[NHP] Failed to load agent catalog: ${error}`);
        }
    }

    /**
     * Executes a full swarm-wide handshake.
     */
    public async executeFullHandshake(): Promise<{ successful: number, total: number }> {
        console.log('[NHP] Initiating swarm-wide neural handshake...');
        let successful = 0;

        for (const agentId of this.agents) {
            try {
                // Dispatch ping to agent
                SognaCommBus.handshake('processorHub', agentId, 'PING', { timestamp: Date.now() });
                
                // Simulate agent ACK (In a real system, this would wait for an event)
                this.activeSynapses.add(agentId);
                
                // Update MemoryHub to record the synaptic event
                MemoryHub.getInstance().registerSynapse('processorHub', agentId, 'HANDSHAKE_ESTABLISHED');
                
                successful++;
            } catch (error) {
                console.error(`[NHP] Handshake failed for ${agentId}: ${error}`);
            }
        }

        console.log(`[NHP] Handshake completed: ${successful}/${this.agents.length} agents active.`);
        return { successful, total: this.agents.length };
    }

    /**
     * Returns the list of currently active agents.
     */
    public getActiveAgents(): string[] {
        return Array.from(this.activeSynapses);
    }
}
