import chalk from 'chalk';
import { StateStore, type LokiState } from './StateStore.js';
import { Supervisor } from './Supervisor.js';
import { Provider } from './Provider.js';
import { ProviderFactory } from './ProviderFactory.js';
import { QualityCouncil } from './QualityCouncil.js';
import { CouncilEvidence } from './gates/types.js';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

export class Runner {
  private stateStore: StateStore;
  private supervisor: Supervisor;
  private primaryProvider: Provider;
  private council: QualityCouncil;

  constructor(baseDir: string = '.') {
    this.stateStore = new StateStore(baseDir);
    this.supervisor = new Supervisor();
    this.primaryProvider = ProviderFactory.getProvider();
    this.council = new QualityCouncil(baseDir);
  }

  async start(prdPath?: string) {
    console.log(chalk.bold.cyan('\nLoki Mode: Autonomous Agent Swarm (Windows Native)'));
    console.log(chalk.dim('===================================================='));

    // 1. Initialize State
    const projectName = prdPath ? path.basename(prdPath, '.md') : 'new-project';
    const state = await this.stateStore.init(projectName);
    
    console.log(chalk.green(`\n[INIT] Session: ${state.sessionId}`));
    console.log(chalk.green(`[INIT] Project: ${state.projectName}`));
    
    // 2. Load PRD
    let prdContent = '';
    if (prdPath && await fs.pathExists(prdPath)) {
      prdContent = await fs.readFile(prdPath, 'utf8');
      console.log(chalk.green(`[INIT] Loaded PRD from ${prdPath}`));
    }

    // 3. Autonomous Loop (RARV Cycle)
    const MAX_ITERATIONS = parseInt(process.env.LOKI_MAX_ITERATIONS || '10');
    
    while (state.currentIteration < MAX_ITERATIONS) {
      state.currentIteration++;
      await this.stateStore.saveState(state);

      try {
        console.log(chalk.bold.magenta(`\n[ITERATION ${state.currentIteration}] Starting loop...`));
        
        // 1. REASON: Brainstorm implementation
        const plan = await this.runReasoning(state, prdContent);
        
        // 2. ACT: Execute changes
        await this.runActing(state, plan);
        
        // 3. VERIFY & REFLECT: Run Quality Council
        const evidence = await this.collectEvidence(state, prdPath);
        const { passed } = await this.council.evaluate(evidence);

        if (passed) {
          console.log(chalk.bold.green(`\n[SUCCESS] Project completed and verified at iteration ${state.currentIteration}`));
          return;
        }

        console.log(chalk.yellow(`\n[CONTINUE] Project requires further work. Reflecting on findings...`));
      } catch (error: any) {
        console.error(chalk.red(`\n[ERROR] Iteration ${state.currentIteration} failed: ${error.message}`));
        // In a real autonomous system, we might try to auto-fix the error in the next iteration
      }
    }

    console.log(chalk.bold.red(`\n[LIMIT] Reached maximum iterations (${MAX_ITERATIONS}). Stopping.`));
  }

  private async runReasoning(state: LokiState, prd: string): Promise<string> {
    console.log(chalk.cyan(`  ${chalk.bold('🧠')} Reasoning...`));
    
    const prompt = `
      You are the LOKI REASONING AGENT. 
      Analyze the PRD and create an implementation strategy for this iteration.
      Iteration: ${state.currentIteration}
      
      PRD:
      ${prd || 'No PRD. Help me start the project.'}
      
      Current directory status:
      ${execSync('git status --short').toString() || 'Empty directory'}
      
      Output a structured plan for the ACTING agent.
    `;

    return await this.primaryProvider.invoke(prompt, { tier: 'planning' });
  }

  private async runActing(state: LokiState, plan: string) {
    console.log(chalk.cyan(`  ${chalk.bold('🔨')} Acting...`));
    
    // Default to Aider or Claude for acting
    const actingProvider = ProviderFactory.getProvider(process.env.LOKI_ACTING_PROVIDER || 'claude');
    
    const prompt = `
      You are the LOKI ACTING AGENT. 
      Execute the following implementation plan. Perform file edits as needed.
      
      PLAN:
      ${plan}
    `;

    await actingProvider.invoke(prompt, { tier: 'development' });
  }

  private async collectEvidence(state: LokiState, prdPath?: string): Promise<CouncilEvidence> {
    const gitDiff = execSync('git diff HEAD').toString();
    
    return {
      iterationCount: state.currentIteration,
      prdPath,
      gitDiff,
      testLogs: [] // Would be populated from log files
    };
  }
}
