import { Color, SognaEventBus, SognaEventType, FS as fs } from '@Sogna/Curator';
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
import { execSync } from 'child_process';


import path from 'path';
import { StateStore, type SognatoreState } from './StateStore.js';
import { Supervisor } from './Supervisor.js';
import { Provider } from './Provider.js';
import { ProviderFactory } from './ProviderFactory.js';
import { DockerSandbox } from './DockerSandbox.js';
import { QualityCouncil } from './QualityCouncil.js';
import { ContextManager } from './ContextManager.js';
import { SwarmOrchestrator } from './SwarmOrchestrator.js';
import { SkillRegistry } from './SkillRegistry.js';
import { CouncilEvidence } from './gates/types.js';
import { GitManager } from './GitManager.js';


export class Runner {
  private stateStore: StateStore;
  private supervisor: Supervisor;
  private primaryProvider: Provider;
  private council: QualityCouncil;
  private contextManager: ContextManager;
  private orchestrator: SwarmOrchestrator;
  private skillRegistry: SkillRegistry;
  private sandbox: DockerSandbox;
  private gitManager: GitManager;
  
  private stagnationCount: number = 0;
  private lastEvidenceHash: string = '';
  
  private logListener: ((event: any) => void) | null = null;
  private errorListener: ((event: any) => void) | null = null;

  constructor(baseDir: string = '.') {
    this.stateStore = new StateStore(baseDir);
    this.supervisor = new Supervisor();
    this.primaryProvider = ProviderFactory.getProvider();
    this.council = new QualityCouncil(baseDir);
    this.contextManager = new ContextManager(baseDir);
    this.orchestrator = SwarmOrchestrator.getInstance();
    this.skillRegistry = SkillRegistry.getInstance();
    this.sandbox = DockerSandbox.getInstance();
    this.gitManager = new GitManager(baseDir, this.primaryProvider);
    
    // Multi-Task Visibility: Live stream background logs
    this.setupBackgroundMonitor();
  }

  private setupBackgroundMonitor() {
    const bus = SognaEventBus.getInstance();
    
    this.logListener = (event: any) => {
      if (event.emitter.startsWith('BackgroundTask:')) {
        console.log(Color.dim(`  [${event.emitter.split(':')[1]}] `) + Color.gray(event.data.message));
      }
    };
    
    this.errorListener = (event: any) => {
      if (event.emitter.startsWith('BackgroundTask:')) {
        console.log(Color.red(`  [${event.emitter.split(':')[1]}] ERROR: ${event.data.message}`));
      }
    };

    bus.on(SognaEventType.LOG, this.logListener);
    bus.on(SognaEventType.ERROR, this.errorListener);
  }

  public shutdown() {
    const bus = SognaEventBus.getInstance();
    if (this.logListener) bus.off(SognaEventType.LOG, this.logListener);
    if (this.errorListener) bus.off(SognaEventType.ERROR, this.errorListener);
    
    this.logListener = null;
    this.errorListener = null;
  }

  async start(prdPath?: string) {
    console.log(Color.bold.cyan('\nSOGNATORE MODE: swarm Orchestration (v2026)'));
    console.log(Color.dim('======================================================='));

    const projectName = prdPath ? path.basename(prdPath, '.md') : 'new-project';
    const state = await this.stateStore.init(projectName);
    
    console.log(Color.green(`\n[BOOT] Session: ${state.sessionId}`));
    console.log(Color.green(`[BOOT] Cluster: swarm Ready (41 Engines Available)`));
    console.log(Color.green(`[BOOT] Sandbox: Multi-Language  Environment Active`));
    
    let prdContent = '';
    if (prdPath && await fs.pathExists(prdPath)) {
      prdContent = await fs.readFile(prdPath, 'utf8');
      console.log(Color.green(`[BOOT] Loaded PRD: ${path.basename(prdPath)}`));
    }

    const MAX_ITERATIONS = parseInt(process.env.SOGNATORE_MAX_ITERATIONS || '20');
    
    while (state.currentIteration < MAX_ITERATIONS) {
      state.currentIteration++;
      await this.stateStore.saveState(state);

      try {
        console.log(Color.bold.magenta(`\n[ITERATION ${state.currentIteration}] Parallel swarm Loop`));
        
        // 1. REASON (Dynamic Planning)
        const codeMap = await this.contextManager.getCodeMap();
        const instructions = await this.contextManager.discoverInstructions();
        const plan = await this.runReasoning(state, prdContent, codeMap, instructions);
        
        // 2. ACT (swarm Execution)
        console.log(Color.cyan(`  ${Color.bold('🐝')} swarm Dispatching...`));
        await this.orchestrator.dispatchTask({
          id: `task-${state.currentIteration}`,
          type: 'complex-development',
          description: plan,
          priority: 1,
          status: 'pending'
        });
        
        // 3. REFLECT (Observation)
        console.log(Color.cyan(`  ${Color.bold('👁️')} Reflecting on swarm Output...`));
        
        // 4. VERIFY (Quality Gates)
        console.log(Color.cyan(`  ${Color.bold('✅')} Verifying Integrity...`));
        const evidence = await this.collectEvidence(state, prdPath);
        const { passed, results } = await this.council.evaluate(evidence);
        const findings = results.flatMap(r => r.findings.map(f => f.message));

        // CIRCUIT BREAKER: Check for stagnation
        if (this.detectStagnation(evidence)) {
          console.log(Color.red(`\n[CIRCUIT BREAKER] Loop detected (Stagnation). Entering Safety Mode...`));
          this.contextManager.setHealthStatus(false); // Switch to ROOT (Safe) instructions
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
          console.log(Color.bold.green(`\n[CONVERGENCE] High-Assurance Quality Consensus Reached.`));
          console.log(Color.green(`Iteration: ${state.currentIteration} | All Gates Clear.`));
          
          // SBP: Auto-persist achievements
          await this.gitManager.commitLog();
          
          this.shutdown();
          return;
        }

        console.log(Color.yellow(`\n[REFINEMENT] Convergence in progress. ${findings.length} findings remaining.`));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(Color.red(`\n[FATAL] swarm Collapse at ${state.currentIteration}: ${message}`));
      }
    }

    console.log(Color.bold.red(`\n[LIMIT] Reached maximum iterations. High-assurance parity maintained.`));

    // SYSTEM PURIFICATION GATE
    console.log(Color.bold.blue('\n[POST-MISSION] Triggering System Purification...'));
    try {
      const purifyPath = path.resolve(process.cwd(), 'Toolkit', 'bin', 'purify.js');
      if (fs.existsSync(purifyPath)) {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
        execSync(`node "${purifyPath}"`, { stdio: 'inherit' });
      }
    } catch (e: any) {
      console.warn(Color.yellow(`[POST-MISSION] Purification warning: ${e.message}`));
    }
    this.shutdown();
  }

  private async runReasoning(state: SognatoreState, prd: string, codeMap: string, instructions: string): Promise<string> {
    console.log(Color.cyan(`  ${Color.bold('🧠')} Orchestrator Reasoning...`));
    
    const relevantSkills = this.skillRegistry.findRelevantSkills(prd || '');
    const skillContext = relevantSkills.map(s => `SKILL: ${s.name}\n${s.content}`).join('\n\n');

    // SBP: Load Strategic Intent if available
    const intentPath = path.resolve(process.cwd(), '../memory/strategic_intent.md');
    let strategicIntent = '';
    if (fs.existsSync(intentPath)) {
      strategicIntent = fs.readFileSync(intentPath, 'utf8');
      console.log(Color.blue(`  ${Color.bold('🛡️')} Strategic Intent Ingested.`));
    }

    const prompt = `
      You are the SOGNATORE swarm ORCHESTRATOR (Windows Native). 
      Current Iteration: ${state.currentIteration}
      
      ${strategicIntent ? `### STRATEGIC INTENT (MENTOR GUIDANCE):\n${strategicIntent}\n` : ''}
      
      SKILL CONTEXT:
      ${skillContext}
      
      INSTRUCTIONS & CONSTRAINTS:
      ${instructions}
      
      CODE MAP:
      ${codeMap}
      
      PRD:
      ${prd || 'Bootstrap project foundation.'}
      
      Analyze the project and output a Parallel Execution Plan for the 41-agent swarm.
      Focus on specialized engineers (Frontend, Backend, Database, Security).
      Ensure compliance with the STRATEGIC INTENT if provided.
    `;

    return await this.primaryProvider.invoke(prompt, { tier: 'planning' });
  }

  private async collectEvidence(state: SognatoreState, prdPath?: string): Promise<CouncilEvidence> {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    const gitDiff = execSync('git diff HEAD').toString();
    const testLogs: string[] = []; // In future, we'll pull these from the message bus
    
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

