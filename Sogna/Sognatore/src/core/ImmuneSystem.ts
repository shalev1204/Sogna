import { Hub } from '../Sentinel-Sognatore/Hub.js';
import { Orchestrator } from './Orchestrator.js';
import { Guardian } from './Guardian.js';
import { PruningService } from './memory/PruningService.js';
import path from 'path';
import chalk from 'chalk';
/**
 * Sogna Immune System
 */
export class ImmuneSystem {
  static async start() {
    const orchestrator = Orchestrator.getInstance();

    // 1. Sentinel Vigilance Service (Audit integrity every 5 minutes)
    orchestrator.registerService({
      name: 'SentinelVigilance',
      intervalMs: 5 * 60 * 1000,
      task: async () => {
        console.log(chalk.blue('[IMMUNE] Sentinel performing integrity pulse...'));
        const guardian = Guardian.getInstance();
        const hub = Hub.getInstance();
        
        // Validate core signatures
        const sognatoreRoot = hub.getSognatoreRoot();
        const isValid = hub.validateSignature(sognatoreRoot);
        
        if (!isValid) {
          hub.reportIntel('CRITICAL', 'Integrity breach detected by background Sentinel!', 'ImmuneSystem');
          // In high-security mode, this could trigger a panic
        }
      }
    });

    // 2. Predatore Simulation Service (Entropy check every 15 minutes)
    orchestrator.registerService({
      name: 'PredatoreStressTest',
      intervalMs: 15 * 60 * 1000,
      task: async () => {
        console.log(chalk.magenta('[IMMUNE] Predatore running background stress test...'));
      }
    });

    // 3. Neural Pruning Service (Cleanup once a day)
    orchestrator.registerService({
      name: 'NeuralPruning',
      intervalMs: 24 * 60 * 60 * 1000,
      task: async () => {
        console.log(chalk.yellow('[IMMUNE] Running neural pruning cycle...'));
        const pruning = PruningService.getInstance();
        const indexPath = path.join(process.cwd(), 'memory', 'intelligence', 'index.json');
        
        await pruning.prune(indexPath, {
          minWeight: 0.2,
          maxAgeDays: 30,
          preserveTags: ['institutional', 'core', 'security']
        });
      }
    });

    console.log(chalk.bold.green('🛡️ Immune System Mode ACTIVE (Swarm Concurrency Enabled)'));
  }
}
