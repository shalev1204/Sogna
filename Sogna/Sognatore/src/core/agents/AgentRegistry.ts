import { Agent, type AgentState } from './Agent.js';
import { AgentFactory } from './AgentFactory.js';
import fs from 'fs';
import path from 'path';
import { Guardian } from '../Guardian.js';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private activeAgents: Map<string, Agent> = new Map();
  private stateDir: string;

  private constructor() {
    this.stateDir = path.join(process.cwd(), 'Sognatore', '.sognatore', 'state', 'agents');
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  async getAgent(type: string, idSuffix?: string): Promise<Agent> {
    const agentId = idSuffix ? `${type}-${idSuffix}` : type;
    
    if (this.activeAgents.has(agentId)) {
      return this.activeAgents.get(agentId)!;
    }

    const factory = await AgentFactory.getInstance();
    const { role, provider, model, tier } = await factory.getAgent(type);
    
    const agent = new Agent(agentId, role, provider, model, tier);
    this.activeAgents.set(agentId, agent);
    
    return agent;
  }

  /**
   * Discovers all agents that have been previously initialized in the state directory.
   */
  async discoverExistingAgents(): Promise<Agent[]> {
    if (!fs.existsSync(this.stateDir)) return [];
    
    const files = fs.readdirSync(this.stateDir);
    const discovered: Agent[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = path.basename(file, '.json');
        const encryptedData = fs.readFileSync(path.join(this.stateDir, file), 'utf8');
        const state = Guardian.getInstance().unsealData<AgentState>(encryptedData);
        
        if (state) {
          discovered.push(await this.getAgent(state.type, id.includes('-') ? id.split('-')[1] : undefined));
        }
      }
    }

    return discovered;
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.activeAgents.values());
  }

  getAgentsBySwarm(swarm: string): Agent[] {
    return this.getActiveAgents().filter(a => a.getMetadata().swarm === swarm);
  }

  /**
   * Resolves the correct specialist (agent type) for a given task type.
   * Centralizes the mapping logic for institutional consistency.
   */
  resolveSpecialist(taskType: string): string {
    const catalogPath = path.join(process.cwd(), 'resources', 'config', 'swarm_catalog.json');
    if (fs.existsSync(catalogPath)) {
      try {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        
        // 1. Precise Match in Swarms or Evolved Swarms
        const swarms = { ...catalog.swarms, ...catalog.evolved_swarms };
        for (const swarm of Object.values(swarms)) {
          const agents = (swarm as any).agents || [];
          if (agents.includes(taskType)) return taskType;
          
          // 2. Prefix Match (e.g. 'ui-' -> 'eng-frontend')
          const prefix = taskType.split('-')[0];
          const match = agents.find((a: string) => a.startsWith(prefix));
          if (match) return match;
        }
      } catch (e) {
        console.error('[REGISTRY] Failed to parse swarm_catalog.json. Using fallbacks.');
      }
    }

    // 3. Institutional Legacy Fallbacks (Centralized)
    if (taskType.startsWith('ui-')) return 'eng-frontend';
    if (taskType.startsWith('api-')) return 'eng-backend';
    if (taskType.startsWith('db-')) return 'eng-database';
    if (taskType.startsWith('sec-')) return 'ops-security';
    if (taskType.startsWith('research-')) return 'orch-researcher';
    if (taskType.startsWith('review-')) return 'supervisor';
    
    return 'eng-backend'; // Global baseline fallback
  }
}
