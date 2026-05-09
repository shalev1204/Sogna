#!/usr/bin/env node
import { Color } from '@Sogna/Curator';

/**
 * SOGNA objective
 * The unified entry point for cloning, initializing, and creating worlds.
 */


import core from '../core/core.js';

async function main() {
  console.log(Color.cyan.bold('\n🚀 SOGNA objective: Activating the Creator of Worlds...'));
  console.log(Color.gray('--------------------------------------------------'));

  try {
    // Phase 1: Wake up the processor
    await core.wakeUp();
    console.log(Color.green('✔  core: All systems operational.'));

    // Phase 2: Architect mapping (Navigator)
    console.log(Color.yellow('\n[PHASE 1]: Architectural Mapping'));
    const map = await core.mapArchitecture();
    if (map) {
      console.log(Color.green('✔  NAVIGATOR: Project landscape mapped.'));
    }

    // Phase 3: Design Reasoning (Stylist)
    console.log(Color.yellow('\n[PHASE 2]: system Design Reasoning'));
    const design = await core.generateDesignSystem('Sogna Default World');
    if (design) {
      console.log(Color.green('✔  STYLIST: Visual identity established.'));
    }

    console.log(Color.cyan.bold('\n✨ Sogna has finished the objective initialization.'));
    console.log(Color.white('Your project is now natively intelligent and design-ready.'));

  } catch (error) {
    console.error(Color.red('\n❌ SOGNA objective failed:'), error.message);
    process.exit(1);
  }

  console.log(Color.gray('\n"The objective is the infrastructure of the future."'));
  console.log(Color.gray('--------------------------------------------------\n'));
}

main();

