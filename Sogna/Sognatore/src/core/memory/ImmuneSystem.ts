import { MemoryHub } from './MemoryHub.js';

export interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  orphanedAgents: string[];
  silos: string[][];
  recommendations: string[];
}

/**
 * ImmuneSystem - Monitoring the integrity of the system Network.
 */
export class ImmuneSystem {
  private hub: MemoryHub;

  constructor(hub: MemoryHub) {
    this.hub = hub;
  }

  /**
   * Performs a full scan of the system graph to detect health issues.
   */
  async scanHealth(): Promise<HealthReport> {
    const graph = await this.hub.getsystemGraph();
    const orphanedAgents: string[] = [];
    const recommendations: string[] = [];
    
    // 1. Detect Orphaned Agents (Nodes with no edges)
    graph.nodes.forEach(node => {
      const isConnected = graph.edges.some(e => e.source === node.id || e.target === node.id);
      if (!isConnected) {
        orphanedAgents.push(node.id);
      }
    });

    if (orphanedAgents.length > 0) {
      recommendations.push(`🔗 Connect orphaned agents: ${orphanedAgents.join(', ')} to their respective swarms.`);
    }

    // 2. Detect Silos (Isolated clusters - Simplified logic)
    // For now, we just count agents with very few connections
    const lowConnectivity = graph.nodes.filter(n => {
      const count = graph.edges.filter(e => e.source === n.id || e.target === n.id).length;
      return count === 1;
    });

    if (lowConnectivity.length > 5) {
      recommendations.push(`🧠 High risk of Knowledge Silos detected. Increase cross-agent linking.`);
    }

    const status = orphanedAgents.length > 0 || lowConnectivity.length > 5 ? 'warning' : 'healthy';

    return {
      status,
      orphanedAgents,
      silos: [lowConnectivity.map(n => n.id)],
      recommendations
    };
  }
}
