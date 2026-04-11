import { Agent } from './Agent.js';
import { AgentFactory } from './AgentFactory.js';
import fs from 'fs';
import path from 'path';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private activeAgents: Map<string, Agent> = new Map();
  private stateDir: string;

  private constructor() {
    this.stateDir = path.join(process.cwd(), '.loki', 'state', 'agents');
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
    const { role, provider, model } = await factory.getAgent(type);
    
    const agent = new Agent(agentId, role, provider, model);
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
        const state = JSON.parse(fs.readFileSync(path.join(this.stateDir, file), 'utf8'));
        discovered.push(await this.getAgent(state.type, id.includes('-') ? id.split('-')[1] : undefined));
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
}
