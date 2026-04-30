import fs from 'fs-extra';
import chalk from 'chalk';

export interface PruningOptions {
  minWeight: number;
  maxAgeDays: number;
  preserveTags: string[];
}

/**
 * Sogna Neural Pruning Service - Entropy Control
 */
export class PruningService {
  private static instance: PruningService;

  private constructor() {}

  public static getInstance(): PruningService {
    if (!PruningService.instance) {
      PruningService.instance = new PruningService();
    }
    return PruningService.instance;
  }

  /**
   * Prunes the neural index based on relevance and age.
   */
  public async prune(indexPath: string, options: PruningOptions): Promise<{ removedNodes: number, removedConnections: number }> {
    if (!fs.existsSync(indexPath)) return { removedNodes: 0, removedConnections: 0 };

    const index = await fs.readJson(indexPath);
    const initialNodeCount = index.fragments.length;
    const initialConnCount = (index.connections || []).length;

    const now = new Date();
    const ageLimit = options.maxAgeDays * 24 * 60 * 60 * 1000;

    // 1. Filter Fragments (Nodes)
    index.fragments = index.fragments.filter((f: any) => {
      const isInstitutional = f.tags.some((t: string) => options.preserveTags.includes(t));
      if (isInstitutional) return true;

      const age = now.getTime() - new Date(f.timestamp).getTime();
      return age < ageLimit;
    });

    const activeKeys = new Set(index.fragments.map((f: any) => f.key));

    // 2. Filter Connections
    if (index.connections) {
      index.connections = index.connections.filter((c: any) => {
        // Must have both nodes still active
        if (!activeKeys.has(c.from) || !activeKeys.has(c.to)) return false;
        
        // Must be above weight threshold
        return c.weight >= options.minWeight;
      });
    }

    await fs.writeJson(indexPath, index, { spaces: 2 });

    const removedNodes = initialNodeCount - index.fragments.length;
    const removedConnections = initialConnCount - (index.connections || []).length;

    if (removedNodes > 0 || removedConnections > 0) {
      console.log(chalk.yellow(`[PRUNING] Cleaned up ${removedNodes} nodes and ${removedConnections} connections.`));
    }

    return { removedNodes, removedConnections };
  }
}
