import chalk from 'chalk';
import { StateStore, type LokiState } from './StateStore.js';
import { Supervisor } from './Supervisor.js';
import { Provider } from './Provider.js';
import { ProviderFactory } from './ProviderFactory.js';
import { QualityCouncil } from './QualityCouncil.js';
import { ContextManager } from './ContextManager.js';
import { SwarmOrchestrator } from './SwarmOrchestrator.js';
import { SkillRegistry } from './SkillRegistry.js';
import { CouncilEvidence } from './gates/types.js';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

export class Runner {
  private stateStore: StateStore;
  private supervisor: Supervisor;
  private primaryProvider: Provider;
  private council: QualityCouncil;
  private contextManager: ContextManager;
  private orchestrator: SwarmOrchestrator;
  private skillRegistry: SkillRegistry;
  
  private stagnationCount: number = 0;
  private lastEvidenceHash: string = '';

  constructor(baseDir: string = '.') {
    this.stateStore = new StateStore(baseDir);
    this.supervisor = new Supervisor();
    this.primaryProvider = ProviderFactory.getProvider();
    this.council = new QualityCouncil(baseDir);
    this.contextManager = new ContextManager(baseDir);
    this.orchestrator = SwarmOrchestrator.getInstance();
    this.skillRegistry = SkillRegistry.getInstance();
  }

  async start(prdPath?: string) {
    console.log(chalk.bold.cyan('\nLOKI MODE: Swarm Orchestration (v2026-NATIVE)'));
    console.log(chalk.dim('===================================================='));

    const projectName = prdPath ? path.basename(prdPath, '.md') : 'new-project';
    const state = await this.stateStore.init(projectName);
    
    console.log(chalk.green(`\n[BOOT] Session: ${state.sessionId}`));
    console.log(chalk.green(`[BOOT] Cluster: Swarm Ready (41 Engines Available)`));
    
    let prdContent = '';
    if (prdPath && await fs.pathExists(prdPath)) {
      prdContent = await fs.readFile(prdPath, 'utf8');
      console.log(chalk.green(`[BOOT] Loaded PRD: ${path.basename(prdPath)}`));
    }

    const MAX_ITERATIONS = parseInt(process.env.LOKI_MAX_ITERATIONS || '20');
    
    while (state.currentIteration < MAX_ITERATIONS) {
      state.currentIteration++;
      await this.stateStore.saveState(state);

      try {
        console.log(chalk.bold.magenta(`\n[ITERATION ${state.currentIteration}] Parallel Swarm Loop`));
        
        // 1. DYNAMIC CONTEXT & REASONING
        const codeMap = await this.contextManager.getCodeMap();
        const plan = await this.runReasoning(state, prdContent, codeMap);
        
        // 2. SWARM EXECUTION (Parallel)
        console.log(chalk.cyan(`  ${chalk.bold('🐝')} Swarm Dispatching...`));
        await this.orchestrator.dispatchTask({
          id: `task-${state.currentIteration}`,
          type: 'complex-development',
          description: plan,
          priority: 1,
          status: 'pending'
        });
        
        // 3. QUALITY MONITORING & CONVERGENCE
        const evidence = await this.collectEvidence(state, prdPath);
        const { passed, results } = await this.council.evaluate(evidence);
        const findings = results.flatMap(r => r.findings.map(f => f.message));

        // CIRCUIT BREAKER: Check for stagnation
        if (this.detectStagnation(evidence)) {
          console.log(chalk.red(`\n[CIRCUIT BREAKER] Loop detected (Stagnation). Triggering Crisis Responder Agent...`));
          await this.orchestrator.dispatchTask({
            id: `fix-${state.currentIteration}`,
            type: 'ops-security',
            description: `The swarm is stuck. Findings: ${findings.join(', ')}. Break the loop.`,
            priority: 10,
            status: 'pending'
          });
          continue;
        }

        if (passed) {
          console.log(chalk.bold.green(`\n[CONVERGENCE] High-Assurance Quality Consensus Reached.`));
          console.log(chalk.green(`Iteration: ${state.currentIteration} | All Gates Clear.`));
          return;
        }

        console.log(chalk.yellow(`\n[REFINEMENT] Convergence in progress. ${findings.length} findings remaining.`));
      } catch (error: any) {
        console.error(chalk.red(`\n[FATAL] Swarm Collapse at ${state.currentIteration}: ${error.message}`));
      }
    }

    console.log(chalk.bold.red(`\n[LIMIT] Reached maximum iterations. High-assurance parity maintained.`));
  }

  private async runReasoning(state: LokiState, prd: string, codeMap: string): Promise<string> {
    console.log(chalk.cyan(`  ${chalk.bold('🧠')} Orchestrator Reasoning...`));
    
    const relevantSkills = this.skillRegistry.findRelevantSkills(prd || '');
    const skillContext = relevantSkills.map(s => `SKILL: ${s.name}\n${s.content}`).join('\n\n');

    const prompt = `
      You are the LOKI SWARM ORCHESTRATOR (Windows Native). 
      Current Iteration: ${state.currentIteration}
      
      SKILL CONTEXT:
      ${skillContext}
      
      CODE MAP:
      ${codeMap}
      
      PRD:
      ${prd || 'Bootstrap project foundation.'}
      
      Analyze the project and output a Parallel Execution Plan for the 41-agent swarm.
      Focus on specialized engineers (Frontend, Backend, Database, Security).
    `;

    return await this.primaryProvider.invoke(prompt, { tier: 'planning' });
  }

  private async collectEvidence(state: LokiState, prdPath?: string): Promise<CouncilEvidence> {
    const gitDiff = execSync('git diff HEAD').toString();
    const testLogs: any[] = []; // In future, we'll pull these from the message bus
    
    return {
      iterationCount: state.currentIteration,
      prdPath,
      gitDiff,
      testLogs
    };
  }

  private detectStagnation(evidence: CouncilEvidence): boolean {
    const hash = Buffer.from(evidence.gitDiff + (evidence.testLogs || '').toString()).toString('base64');
    if (hash === this.lastEvidenceHash) {
      this.stagnationCount++;
    } else {
      this.stagnationCount = 0;
      this.lastEvidenceHash = hash;
    }
    return this.stagnationCount >= 2;
  }
}
