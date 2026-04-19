import chalk from 'chalk';
import { SognaEventBus, SognaEventType, SognaEvent } from '@sogna/toolkit';
import { getSwarmStyle } from '../utils/SwarmVisuals.js';

export class TerminalSubscriber {
  private fingerprintHistory: Set<string> = new Set();

  constructor() {
    const bus = SognaEventBus.getInstance();

    bus.on(SognaEventType.THOUGHT, (e: SognaEvent) => this.processEvent(e, () => this.renderThought(e)));
    bus.on(SognaEventType.ACTION_START, (e: SognaEvent) => this.processEvent(e, () => this.renderActionStart(e)));
    bus.on(SognaEventType.ACTION_END, (e: SognaEvent) => this.processEvent(e, () => this.renderActionEnd(e)));
    bus.on(SognaEventType.OBSERVATION, (e: SognaEvent) => this.processEvent(e, () => this.renderObservation(e)));
    bus.on(SognaEventType.ERROR, (e: SognaEvent) => this.processEvent(e, () => this.renderError(e)));
    bus.on(SognaEventType.RECOVERY, (e: SognaEvent) => this.processEvent(e, () => this.renderRecovery(e)));
    
    // Reset fingerprint history on task end
    bus.on('system.task_end', () => {
      this.fingerprintHistory.clear();
    });
  }

  private processEvent(e: SognaEvent, renderFn: () => void) {
    if (this.fingerprintHistory.has(e.fingerprint)) {
      // Quietly skip duplicate thoughts or observations to keep terminal clean
      if (e.type === SognaEventType.THOUGHT || e.type === SognaEventType.OBSERVATION) return;
    }
    
    this.fingerprintHistory.add(e.fingerprint);
    renderFn();
  }

  private renderThought(e: SognaEvent) {
    const visuals = getSwarmStyle(e.swarm || 'orchestration');
    const header = chalk.bold(visuals.color(`${visuals.icon} [THOUGHT] ${e.emitter}`));
    console.log(`\n${header} ${chalk.dim(`(seq: ${e.sequenceId})`)}`);
    console.log(chalk.dim(e.data.content));
  }

  private renderActionStart(e: SognaEvent) {
    const visuals = getSwarmStyle(e.swarm || 'orchestration');
    console.log(chalk.cyan(`  ⚡ [CALLING_TOOL] ${e.data.tool}`));
  }

  private renderActionEnd(e: SognaEvent) {
    console.log(chalk.dim(`  ✓ [TOOL_COMPLETED] ${e.data.tool}`));
  }

  private renderObservation(e: SognaEvent) {
    const resultLen = e.data.result?.length || 0;
    console.log(chalk.gray(`  👁  [OBSERVATION] (Result length: ${resultLen > 500 ? 'Truncated' : resultLen})`));
  }

  private renderError(e: SognaEvent) {
    console.log(chalk.bold.red(`\n✘ [BRAIN_ERROR] ${e.emitter} [${e.failureClass}]: ${e.data.message}`));
  }

  private renderRecovery(e: SognaEvent) {
    const icon = e.provenance === 'HEALTH' ? '🩹' : '🛠';
    console.log(chalk.bold.blue(`\n${icon} [SYSTEM_RECOVERY] [${e.failureClass}] Agent ${e.emitter} triggering: ${e.data.recipe}`));
  }
}
