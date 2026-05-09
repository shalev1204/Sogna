import { FS as fs } from '@Sogna/Curator';

import * as path from 'path';
import { Chronicler } from './Chronicler.js';

/**
 * systemLearning - Enabling agents to evolve based on activity.
 */
export class systemLearning {
  private chronicler: Chronicler;

  constructor(chronicler: Chronicler) {
    this.chronicler = chronicler;
  }

  /**
   * Updates an agent's metadata after a successful task.
   */
  async evolveAgent(agentId: string, performance: { success: boolean }): Promise<void> {
    const index = await this.chronicler.getIndex();
    const fragment = index.fragments.find(f => f.key === agentId);

    if (!fragment) {
      console.warn(`[systemLearning] Agent ${agentId} not found for evolution.`);
      return;
    }

    const filePath = fragment.fileName;
    let content = await fs.readFile(filePath, 'utf-8');

    // Extract current metadata
    const currentUsage = parseInt(fragment.properties?.usage_count || '0');
    const currentSuccess = parseInt(fragment.properties?.success_count || '0');

    const newUsage = currentUsage + 1;
    const newSuccess = performance.success ? currentSuccess + 1 : currentSuccess;
    const successRate = ((newSuccess / newUsage) * 100).toFixed(1);

    // Update YAML Frontmatter
    // This is a simple replacement logic
    const properties = {
      usage_count: newUsage.toString(),
      success_count: newSuccess.toString(),
      success_rate: `${successRate}%`,
      last_evolution: new Date().toISOString()
    };

    Object.entries(properties).forEach(([key, val]) => {
      const regex = new RegExp(`^${key}:.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}: ${val}`);
      } else {
        // Append before the closing ---
        content = content.replace(/^---/m, (match, offset) => {
           if (offset === 0) return match; // Skip the first ---
           return match;
        }).replace(/\n---/, `\n${key}: ${val}\n---`);
      }
    });

    await fs.writeFile(filePath, content, 'utf-8');
    
    // Trigger index rebuild to reflect changes
    await this.chronicler.rebuildIndex();
    
    console.log(`[systemLearning] Agent ${agentId} evolved. Success Rate: ${successRate}%`);
  }
}
