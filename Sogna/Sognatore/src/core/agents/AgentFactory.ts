import fs from 'fs';
import path from 'path';
import { Provider } from '../Provider.js';
import { ProviderFactory } from '../ProviderFactory.js';
import { AgentRole, AgentSwarm } from './AgentTypes.js';

import { fileURLToPath } from 'url';

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
  private evolvedAgentsMDPath: string;
  private swarmCatalogPath: string;
  private swarmCatalogCache: any = null;
  private availableProviders: Provider[] = [];

  private sognatoreRoot: string;
  private strategy: ModelStrategy | undefined;

  private constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    // Robust root discovery: Look for the directory containing 'resources'
    const findRoot = (start: string): string => {
      let curr = start;
      const root = path.parse(curr).root;
      while (curr !== root) {
        if (fs.existsSync(path.join(curr, 'resources')) && fs.existsSync(path.join(curr, 'package.json'))) {
          return curr;
        }
        curr = path.join(curr, '..');
      }
      return path.join(__dirname, '..', '..', '..'); // Legacy Fallback
    };

    this.sognatoreRoot = process.env.SOGNATORE_ROOT || findRoot(__dirname);

    this.agentsMDPath = path.join(this.sognatoreRoot, 'resources', 'config', 'agents.md');
    this.evolvedAgentsMDPath = path.join(this.sognatoreRoot, 'resources', 'config', 'evolved_agents.md');
    this.swarmCatalogPath = path.join(this.sognatoreRoot, 'resources', 'config', 'swarm_catalog.json');
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
    const strategyPath = path.join(this.sognatoreRoot, 'resources', 'config', 'model_strategy.json');
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
    const registries = [this.agentsMDPath, this.evolvedAgentsMDPath];
    
    for (const registryPath of registries) {
      if (!fs.existsSync(registryPath)) continue;
      
      const content = fs.readFileSync(registryPath, 'utf8');
      const sections = content.split('---');
      
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
    }

    throw new Error(`Agent type "${type}" not found in current registries.`);
  }

  private getSwarmForAgent(type: string): AgentSwarm {
    if (!fs.existsSync(this.swarmCatalogPath)) return 'orchestration';
    
    if (!this.swarmCatalogCache) {
      this.swarmCatalogCache = JSON.parse(fs.readFileSync(this.swarmCatalogPath, 'utf8'));
    }
    const catalog = this.swarmCatalogCache;
    
    // Check main swarms
    for (const [swarm, config] of Object.entries(catalog.swarms || {})) {
      if ((config as any).agents.includes(type)) return swarm as AgentSwarm;
    }
    
    // Check evolved swarms
    for (const [swarm, config] of Object.entries(catalog.evolved_swarms || {})) {
      if ((config as any).agents.includes(type)) return swarm as AgentSwarm;
    }
    
    return 'orchestration';
  }

  private cleanList(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(line => line.length > 0);
  }

  /**
   * Autonomously enrolls a new specialist into the  Swarm.
   * This involves writing the role to evolved_agents.md and updating the swarm mapping.
   */
  async enrollNewSpecialist(role: AgentRole): Promise<void> {
    const agentEntry = `
---

### ${role.type}
**Status:** PENDING_VALIDATION
**Swarm:** ${role.swarm}
**Capabilities:**
${role.capabilities.map(c => `- ${c}`).join('\n')}

**Task Types:**
${role.taskTypes.map(t => `- ${t}`).join('\n')}

**Quality Checks:**
${role.qualityChecks.map(q => `- ${q}`).join('\n')}
`;

    fs.appendFileSync(this.evolvedAgentsMDPath, agentEntry);

    // Update Swarm Catalog
    const catalog = JSON.parse(fs.readFileSync(this.swarmCatalogPath, 'utf8'));
    
    // If swarm exists in base, add to base. If not, add to evolved_swarms.
    if (catalog.swarms[role.swarm]) {
      if (!catalog.swarms[role.swarm].agents.includes(role.type)) {
        catalog.swarms[role.swarm].agents.push(role.type);
      }
    } else {
      if (!catalog.evolved_swarms[role.swarm]) {
        catalog.evolved_swarms[role.swarm] = { display_name: `Nuevo Enjambre: ${role.swarm}`, agents: [] };
      }
      if (!catalog.evolved_swarms[role.swarm].agents.includes(role.type)) {
        catalog.evolved_swarms[role.swarm].agents.push(role.type);
      }
    }

    fs.writeFileSync(this.swarmCatalogPath, JSON.stringify(catalog, null, 2));
    this.swarmCatalogCache = catalog; // Actualizar caché
  }
}
