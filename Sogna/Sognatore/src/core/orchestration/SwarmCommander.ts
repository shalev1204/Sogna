import { MemoryHub, MemoryResult } from '../memory/MemoryHub.js';
import { Chronicler } from '../memory/Chronicler.js';

export interface swarmAssignment {
  targetAgent: string;
  specialty: string;
  reason: string;
  metadata?: any;
}

/**
 * swarmCommander - The Tactical Orchestrator
 * Uses metadata intelligence to coordinate agent swarms.
 */
export class swarmCommander {
  private hub: MemoryHub;

  constructor(hub: MemoryHub) {
    this.hub = hub;
  }

  /**
   * Identifies the best agents for a specific task based on properties.
   */
  async assembleswarm(filters: Record<string, any>): Promise<swarmAssignment[]> {
    // Query MemoryHub (Episodic + Agency layers)
    const candidates = await this.hub.query(filters);
    
    return candidates.map(c => ({
      targetAgent: c.key === 'unknown' ? (c.metadata?.id || 'unknown') : c.key,
      specialty: c.metadata?.specialty || c.metadata?.swarm || 'generalist',
      reason: `Matched criteria: ${JSON.stringify(filters)}`,
      metadata: c.metadata
    }));
  }

  /**
   * Triggers a "system Handshake" between two agents.
   */
  async coordinate(requester: string, task: string): Promise<string> {
    console.log(`[swarmCommander] Agent ${requester} requesting coordination for: ${task}`);
    
    const keywords = task.toLowerCase().split(' ');
    
    // Search for ANY agent that matches keywords in their properties or ID
    const allAgents = await this.assembleswarm({}); // Get all indexed agents
    
    const matches = allAgents.filter(a => {
      if (!a.targetAgent) return false;
      const metaStr = JSON.stringify(a.metadata || {}).toLowerCase();
      const idStr = a.targetAgent.toLowerCase();
      return keywords.some(k => k.length > 2 && (metaStr.includes(k) || idStr.includes(k)));
    });

    if (matches.length > 0) {
      // Sort by "quality" of match (e.g. ID match is better than metadata match)
      const bestMatch = matches.sort((a, b) => {
        const aIdMatch = keywords.some(k => a.targetAgent!.toLowerCase().includes(k));
        const bIdMatch = keywords.some(k => b.targetAgent!.toLowerCase().includes(k));
        return aIdMatch === bIdMatch ? 0 : aIdMatch ? -1 : 1;
      })[0];

      return `🤝 system Handshake established: ${requester} <-> ${bestMatch.targetAgent}. Dream: ${task}`;
    }

    return `⚠️ No specialized agent found for "${task}". Proceeding with Generalist core.`;
  }
}
