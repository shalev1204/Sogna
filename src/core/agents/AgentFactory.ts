import fs from 'fs';
import path from 'path';
import { Provider } from '../Provider.js';
import { ProviderFactory } from '../ProviderFactory.js';
import { AgentRole, AgentSwarm, AGENT_SWARM_MAPPING } from './AgentTypes.js';

export class AgentFactory {
  private static instance: AgentFactory;
  private agentsMDPath: string;
  private availableProviders: Provider[] = [];

  private constructor() {
    this.agentsMDPath = path.join(process.cwd(), 'references', 'agents.md');
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
  }

  /**
   * Returns a specific agent by type with the best available provider 
   * following the 2026 Resilient Hierarchy.
   */
  async getAgent(type: string): Promise<{ role: AgentRole; provider: Provider; model: string }> {
    const role = await this.parseAgentRole(type);
    const { provider, model } = this.resolveProviderAndModel(role.swarm);
    
    return { role, provider, model };
  }

  private resolveProviderAndModel(swarm: AgentSwarm): { provider: Provider; model: string } {
    const hierarchy = this.getHierarchyForSwarm(swarm);
    
    for (const entry of hierarchy) {
      const provider = this.availableProviders.find(p => p.metadata.name === entry.provider);
      if (provider) {
        return { provider, model: entry.model };
      }
    }

    // Ultimate fallback if no hierarchical match found (should not happen if at least one provider exists)
    if (this.availableProviders.length > 0) {
      const fallback = this.availableProviders[0];
      return { provider: fallback, model: 'best' };
    }

    throw new Error('No AI providers available. Check your environment keys.');
  }

  private getHierarchyForSwarm(swarm: AgentSwarm): { provider: string; model: string }[] {
    switch (swarm) {
      case 'engineering':
        return [
          { provider: 'claude', model: 'claude-4.6-sonnet' },
          { provider: 'openai', model: 'gpt-5.4' },
          { provider: 'gemini', model: 'gemini-3.1-pro' }
        ];
      case 'review':
        return [
          { provider: 'claude', model: 'claude-4.6-opus' },
          { provider: 'openai', model: 'gpt-5.4' },
          { provider: 'claude', model: 'claude-4.6-sonnet' }
        ];
      case 'operations':
      case 'data':
        return [
          { provider: 'gemini', model: 'gemini-3.1-pro' },
          { provider: 'openai', model: 'gpt-5.4' },
          { provider: 'claude', model: 'claude-4.6-sonnet' }
        ];
      case 'business':
      case 'product':
        return [
          { provider: 'openai', model: 'gpt-5.4' },
          { provider: 'claude', model: 'claude-4.6-sonnet' },
          { provider: 'gemini', model: 'gemini-3.1-pro' }
        ];
      case 'orchestration':
      default:
        return [
          { provider: 'claude', model: 'claude-4.6-sonnet' },
          { provider: 'gemini', model: 'gemini-3.1-pro' },
          { provider: 'openai', model: 'gpt-5.4' }
        ];
    }
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

    throw new Error(`Agent type "${type}" not found in references/agents.md`);
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
