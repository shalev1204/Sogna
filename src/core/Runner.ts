import chalk from 'chalk';
import { StateStore, type LokiState } from './StateStore.js';
import { Supervisor } from './Supervisor.js';
import { Provider } from './Provider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import fs from 'fs-extra';
import path from 'path';

export class Runner {
  private stateStore: StateStore;
  private supervisor: Supervisor;
  private provider: Provider;

  constructor(baseDir: string = '.') {
    this.stateStore = new StateStore(baseDir);
    this.supervisor = new Supervisor();
    // Default to Gemini for Phase 1 testing
    this.provider = new GeminiProvider();
  }

  async start(prdPath?: string, providerName: string = 'claude') {
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
    } else {
      console.log(chalk.yellow(`[WARN] No PRD file provided or found.`));
    }

    // 3. Execution Cycle (Basic Phase 1: Reasoning Only)
    try {
      await this.runReasoningPhase(state, prdContent);
    } catch (error: any) {
      console.error(chalk.red(`\n[FATAL] ${error.message}`));
      process.exit(1);
    }
  }

  private async runReasoningPhase(state: LokiState, prd: string) {
    console.log(chalk.bold.magenta(`\n[PHASE] Reasoning (Iteration ${state.currentIteration})`));
    
    const prompt = `
      You are the LOKI REASONING AGENT. 
      Your task is to analyze the following PRD and create an architectural implementation plan.
      
      PRD:
      ${prd || 'No PRD provided. Please help me initialize a new project structure.'}
      
      Output your plan clearly as Markdown.
    `;

    const logFile = await this.stateStore.getLogPath('reasoning', state.currentIteration);
    
    console.log(chalk.dim(`[EXEC] Running architecture analysis via ${this.provider.metadata.displayName}...`));
    
    const output = await this.provider.invoke(prompt, {
      logFile
    });

    console.log(chalk.green(`\n[SUCCESS] Reasoning Phase Complete.`));
    console.log(chalk.dim(`Log saved to: ${logFile}`));
    
    // In a real RARV cycle, we would parse the output and move to 'act'
    console.log(chalk.bold.yellow('\nNext steps for Porting:'));
    console.log('1. Implement "Act" phase (Code generation)');
    console.log('2. Implement "Reflect/Verify" phases (Quality Gates)');
    console.log('3. Integrate multi-agent coordination');
  }
}
