import fs from 'fs';
import path from 'path';
import { Provider } from '../Provider.js';
import { ProviderFactory } from '../ProviderFactory.js';
import { AgentRole, AgentSwarm, AGENT_SWARM_MAPPING } from './AgentTypes.js';

interface TierInfo {
  display_name: string;
  description: string;
  models: Array<{ provider: string; model: string }>;
}

interface ModelStrategy {
  strategy_name: string;
  version: string;
  tiers: Record<string, TierInfo>;
  agent_tier_mapping: Record<string, string>;
  default_tier: string;
}

export class AgentFactory {
  private static instance: AgentFactory;
  private agentsMDPath: string;
  private availableProviders: Provider[] = [];

  private strategy: ModelStrategy | undefined;

  private constructor() {
    this.agentsMDPath = path.join(process.cwd(), 'resources', 'config', 'agents.md');
  }

  static async getInstance(): Promise<AgentFactory> {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
      await AgentFactory.instance.init();
    }
    return AgentFactory.instance;
  }

  private async init() {
    this.availableProviders = await ProviderFactory.getAvailableProviders();
    const strategyPath = path.join(process.cwd(), 'resources', 'config', 'model_strategy.json');
    if (fs.existsSync(strategyPath)) {
      this.strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
    }
  }

  /**
   * Returns a specific agent by type with the best available provider 
   * following the 2026 Tiered Efficiency Strategy.
   */
  async getAgent(type: string): Promise<{ role: AgentRole; provider: Provider; model: string; tier: string }> {
    const role = await this.parseAgentRole(type);
    const { provider, model, tier } = this.resolveProviderAndModel(type, role.swarm);
    
    return { role, provider, model, tier };
  }

  private resolveProviderAndModel(type: string, swarm: AgentSwarm): { provider: Provider; model: string; tier: string } {
    const tierName = this.strategy?.agent_tier_mapping[type] || 
                     this.strategy?.agent_tier_mapping[swarm] || 
                     this.strategy?.default_tier || 'gold';
    
    const tierInfo = this.strategy?.tiers[tierName];
    if (!tierInfo) throw new Error(`Model tier "${tierName}" not defined in model_strategy.json`);

    for (const entry of tierInfo.models) {
      const provider = this.availableProviders.find(p => p.metadata.name === entry.provider);
      if (provider) {
        return { provider, model: entry.model, tier: tierName };
      }
    }

    // Fallback logic if tier models are unavailable
    if (this.availableProviders.length > 0) {
      const fallback = this.availableProviders[0];
      return { provider: fallback, model: 'best', tier: 'gold' };
    }

    throw new Error('No AI providers available. Check your environment keys.');
  }

  private async parseAgentRole(type: string): Promise<AgentRole> {
    const content = fs.readFileSync(this.agentsMDPath, 'utf8');
    const sections = content.split('---');
    
    // Simple parser for agents.md specification
    for (const section of sections) {
      if (section.includes(`### ${type}`)) {
        const capabilitiesMatch = section.match(/\*\*Capabilities:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
        const taskTypesMatch = section.match(/\*\*Task Types:\*\*\s*([\s\S]*?)(?=\*\*|$)/);
        const qualityChecksMatch = section.match(/\*\*Quality Checks:\*\*\s*([\s\S]*?)(?=\*\*|$)/);

        const swarm = this.getSwarmForAgent(type);

        return {
          type,
          swarm,
          capabilities: this.cleanList(capabilitiesMatch ? capabilitiesMatch[1] : ''),
          taskTypes: this.cleanList(taskTypesMatch ? taskTypesMatch[1] : ''),
          qualityChecks: this.cleanList(qualityChecksMatch ? qualityChecksMatch[1] : '')
        };
      }
    }

    throw new Error(`Agent type "${type}" not found in resources/config/agents.md`);
  }

  private getSwarmForAgent(type: string): AgentSwarm {
    for (const [swarm, agents] of Object.entries(AGENT_SWARM_MAPPING)) {
      if (agents.includes(type)) return swarm as AgentSwarm;
    }
    return 'orchestration';
  }

  private cleanList(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0);
  }
}
