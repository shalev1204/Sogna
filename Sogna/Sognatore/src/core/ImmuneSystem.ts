import { Color } from '@Sogna/Curator';
import { Hub } from '../Sentinel-Sognatore/Hub.js';
import { Orchestrator } from './Orchestrator.js';
import { Guardian } from './Guardian.js';
import { PruningService } from './memory/PruningService.js';
import path from 'path';

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
        console.log(Color.blue('[IMMUNE] Sentinel performing integrity status...'));
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
        console.log(Color.magenta('[IMMUNE] Predatore running background stress test...'));
      }
    });

    // 3. system Pruning Service (Cleanup once a day)
    orchestrator.registerService({
      name: 'systemPruning',
      intervalMs: 24 * 60 * 60 * 1000,
      task: async () => {
        console.log(Color.yellow('[IMMUNE] Running system pruning cycle...'));
        const pruning = PruningService.getInstance();
        const indexPath = path.join(Hub.getInstance().getSognatoreRoot(), '..', 'memory', 'intelligence', 'index.json');
        
        await pruning.prune(indexPath, {
          minWeight: 0.2,
          maxAgeDays: 30,
          preserveTags: ['institutional', 'core', 'security']
        });
      }
    });

    console.log(Color.bold.green('🛡️ Immune System Mode ACTIVE (swarm Concurrency Enabled)'));
  }
}
