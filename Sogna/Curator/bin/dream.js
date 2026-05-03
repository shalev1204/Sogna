#!/usr/bin/env node

/**
 * SOGNA DREAM
 * The unified entry point for cloning, initializing, and creating worlds.
 */

import chalk from 'chalk';
import cerebro from '../core/cerebro.js';

async function main() {
  console.log(chalk.cyan.bold('\n🚀 SOGNA DREAM: Activating the Creator of Worlds...'));
  console.log(chalk.gray('--------------------------------------------------'));

  try {
    // Phase 1: Wake up the brain
    await cerebro.wakeUp();
    console.log(chalk.green('✔  CEREBRO: All systems operational.'));

    // Phase 2: Architect mapping (Navigator)
    console.log(chalk.yellow('\n[PHASE 1]: Architectural Mapping'));
    const map = await cerebro.mapArchitecture();
    if (map) {
      console.log(chalk.green('✔  NAVIGATOR: Project landscape mapped.'));
    }

    // Phase 3: Design Reasoning (Stylist)
    console.log(chalk.yellow('\n[PHASE 2]: Neural Design Reasoning'));
    const design = await cerebro.generateDesignSystem('Sogna Default World');
    if (design) {
      console.log(chalk.green('✔  STYLIST: Visual identity established.'));
    }

    console.log(chalk.cyan.bold('\n✨ Sogna has finished the dream initialization.'));
    console.log(chalk.white('Your project is now natively intelligent and design-ready.'));

  } catch (error) {
    console.error(chalk.red('\n❌ SOGNA DREAM failed:'), error.message);
    process.exit(1);
  }

  console.log(chalk.gray('\n"The dream is the infrastructure of the future."'));
  console.log(chalk.gray('--------------------------------------------------\n'));
}

main();

