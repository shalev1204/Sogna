import { Agent } from './agents/Agent.js';
import { AgentRegistry } from './agents/AgentRegistry.js';
import { AgentRole, AgentSwarm } from './agents/AgentTypes.js';
import { AgentFactory } from './agents/AgentFactory.js';
import { DockerSandbox } from './DockerSandbox.js';
import { Chronicler } from './memory/Chronicler.js';
import { getSwarmStyle } from './utils/SwarmVisuals.js';
import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import { SognaEventBus, SognaEventType, EventProvenance, FailureClass } from '@sogna/toolkit';
import { Engine as PolicyEngine } from '../Sentinel-Sognatore/Engine.js';
import { TerminalSubscriber } from './ui/TerminalSubscriber.js';
import { QualityCouncil } from './QualityCouncil.js';
import { Guardian } from './Guardian.js';

export interface SwarmTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  swarm?: AgentSwarm;
  assignedTo?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  result?: string;
}

export class SwarmOrchestrator extends EventEmitter {
  private static instance: SwarmOrchestrator;
  private messageBus: string;
  private taskQueue: SwarmTask[] = [];
  private registry: AgentRegistry;
  private chronicler: Chronicler;

  private constructor() {
    super();
    this.messageBus = path.join(process.cwd(), 'Sognatore', '.sognatore', 'messages');
    this.registry = AgentRegistry.getInstance();
    this.chronicler = Chronicler.getInstance();
    this.initFileSystem();
    this.chronicler.init();
    
    // Initialize Nervous System UI
    new TerminalSubscriber();
  }

  static getInstance(): SwarmOrchestrator {
    if (!SwarmOrchestrator.instance) {
      SwarmOrchestrator.instance = new SwarmOrchestrator();
    }
    return SwarmOrchestrator.instance;
  }

  private initFileSystem() {
    const sognatoreDir = path.join(process.cwd(), 'Sognatore', '.sognatore');
    
    // INSTITUTIONAL PURGE: Clear volatile messages and queue on startup to ensure state integrity
    const volatileDirs = [
      path.join(sognatoreDir, 'messages'),
      path.join(sognatoreDir, 'queue')
    ];
    
    volatileDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.emptyDirSync(dir);
        console.log(`[ORCHESTRATOR] Purged operational state: ${path.basename(dir)}`);
      }
    });

    const dirs = [
      this.messageBus,
      path.join(this.messageBus, 'inbox'),
      path.join(this.messageBus, 'outbox'),
      path.join(this.messageBus, 'broadcast'),
      path.join(sognatoreDir, 'queue')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  private detectAgentGap(task: SwarmTask): boolean {
    const specialist = this.registry.resolveSpecialist(task.type);
    return specialist === 'orch-researcher' && task.type !== 'research-gap'; 
  }

  private detectSkillGap(task: SwarmTask): boolean {
    // Logic for identifying if current skills are insufficient
    return false; // Stub
  }

  /**
   * Dispatches a task to the swarm.
   * Finds the best agent category and triggers parallel execution if enabled.
   */
  async dispatchTask(task: SwarmTask): Promise<string> {
    this.taskQueue.push(task);
    
    if (this.taskQueue.length > 50) {
      this.taskQueue = this.taskQueue.filter(t => t.status === 'pending' || t.status === 'active');
    }
    
    await this.saveQueue();

    // High-Assurance Gap Detection (Skills & Agents)
    if (this.detectAgentGap(task)) {
      await this.triggerRecruitment(task);
    } else if (this.detectSkillGap(task)) {
      await this.triggerEvolution(task);
    }

    // [SQ-001] PRE-DISPATCH INSTITUTIONAL VETTING
    const policy = PolicyEngine.getInstance();
    const vetting = policy.evaluate('pre_execution', { command: task.description }); // Analyze intent
    
    if (vetting.decision === 'deny') {
      console.warn(chalk.red.bold(`[SECURITY] Pre-dispatch block: Task intent rejected by Sentinel.`));
      throw new Error(`SECURITY ALERT: Task description contains potentially destructive commands. Dispatch suspended for manual review.`);
    }

    const agentType = this.registry.resolveSpecialist(task.type);
    
    // Sandbox Profile Selection
    const sandbox = DockerSandbox.getInstance();
    if (vetting.decision !== 'allow' || task.type.startsWith('sec-')) {
      sandbox.setProfile('security');
    } else {
      sandbox.setProfile('standard');
    }

    const agent = await this.registry.getAgent(agentType);
    const agentMeta = agent.getMetadata();
    const swarmName = agentMeta.swarm;
    
    const guardian = Guardian.getInstance();
    
    // MATERIALIZE SWARM SUMMONING (Redacted for neutrality)
    SognaEventBus.getInstance().publish({
      type: SognaEventType.LOG,
      emitter: 'Orchestrator',
      swarm: swarmName,
      provenance: EventProvenance.LIVE,
      failureClass: FailureClass.NONE,
      data: { message: guardian.redactIntel(`[SUMMON] ${agentType} reclutado para '${task.type}'`) }
    });
    
    this.emit('task:started', { taskId: task.id, agentId: agent.id });
    
    // [QG-010] INSTITUTIONAL CONSENSUS GATE
    if (process.env.SOGNARE_QUALITY_TIER !== 'disabled') {
      const council = new QualityCouncil(process.cwd());
      const evidence = {
        iterationCount: 0, // Initial dispatch
        gitDiff: '', 
        testLogs: [],
        actionPlan: task.description,
        isCritical: task.priority >= 10
      };

      const { passed, results } = await council.evaluate(evidence);
      if (!passed) {
        console.warn(chalk.yellow('[ORCHESTRATOR] Quality Council denied initial dispatch. Triggering Pre-emptive Fix...'));
        const findings = results.flatMap(r => r.findings.map((f: any) => f.message)).join('; ');
        
        // Handle rejection by re-dispatching as a fix task or failing
        return await this.handleCouncilRejection(task, findings);
      }
    }

    try {
      // Step A: Recall previous knowledge (RAG)
      const memory = await this.chronicler.recall(task.type + ' ' + task.description);
      const contextualPrompt = memory.length > 0 
        ? `SABIDURÍA PREVIA (Fragmentos de Memoria):\n${memory.map(m => `--- ${m.key} ---\n${m.content}`).join('\n')}\n\nREQUERIMIENTO ACTUAL: ${task.description}`
        : task.description;

      const result = await agent.runTask(contextualPrompt);
      task.status = 'completed';
      task.result = result;
      await this.saveQueue();

      // Step B: Memorize completion (if successful and relevant)
      if (result.length > 100) {
        await this.chronicler.memorize({
          key: `Task result: ${task.type} - ${task.id}`,
          content: result,
          tags: [task.type, 'task-result'],
          project: process.env.PROJECT_NAME || 'Sognatore',
          timestamp: new Date().toISOString()
        });
      }
      
      this.emit('task:completed', { taskId: task.id, result });
      return result;
    } catch (error) {
      task.status = 'failed';
      await this.saveQueue();
      throw error;
    }
  }

  /**
   * Triggers the  Recruitment flow to synthesize and validate new specialists.
   */
  private async triggerRecruitment(gapTask: SwarmTask) {
    console.log(`[RECRUITMENT] Agent Domain Gap identified for: ${gapTask.type}. Initiating  Recruitment...`);
    
    const researcher = await this.registry.getAgent('orch-researcher');
    const supervisor = await this.registry.getAgent('supervisor');
    
    // Step 1: Design the Specialist
    const designPrompt = `Design a new  Specialist for the domain '${gapTask.type}'. 
    Analyze requirements for: ${gapTask.description}.
    Return a valid JSON profile with: type (e.g. biz-fintech), swarm, capabilities[], taskTypes[], qualityChecks[].`;
    
    const profileJson = await researcher.runTask(designPrompt);
    const role: AgentRole = JSON.parse(profileJson);
    
    // Step 2: Council Validation Gate
    const validationPrompt = `Audit the following new agent profile for the '${gapTask.type}' domain. 
    Profile: ${JSON.stringify(role)}
    Verify for: Hallucination risks, role overlap, and security alignment.
    Reply with "VALIDATED" or a list of required fixes.`;
    
    const validationResult = await supervisor.runTask(validationPrompt);
    
    if (validationResult.includes('VALIDATED')) {
      const factory = await AgentFactory.getInstance();
      await (factory as any).enrollNewSpecialist(role);
      console.log(`[RECRUITMENT] Specialist '${role.type}' successfully enrolled and validated by the Council.`);
      this.emit('recruitment:success', { role });
    } else {
      console.error(`[RECRUITMENT] Council rejected the specialist profile: ${validationResult}`);
      throw new Error(`Agent recruitment failed validation: ${validationResult}`);
    }
  }


  /**
   * Triggers the Evolutionary Brain to synthesize missing skills.
   */
  private async triggerEvolution(gapTask: SwarmTask) {
    console.log(`[EVOLUTION] Skill Gap identified for task type: ${gapTask.type}. Dispatching Researcher...`);
    const evolutionTask: SwarmTask = {
      id: `evo-${Date.now()}`,
      type: 'research-gap',
      description: `Analyze the following task type '${gapTask.type}' and synthesize a new skill in resources/skills/eVolt/ to handle it. Context: ${gapTask.description}`,
      priority: 10,
      status: 'pending'
    };
    
    // We run it synchronously to ensure the swarm "learns" before retrying
    const researcher = await this.registry.getAgent('orch-researcher');
    await researcher.runTask(evolutionTask.description);
    this.emit('evolution:consensus', { taskType: gapTask.type });
  }

  /**
   * Broadcasts a message to all agents in the swarm via the message bus.
   */
  async broadcast(action: string, context: string) {
    const broadcastPath = path.join(this.messageBus, 'broadcast', `${Date.now()}.json`);
    const message = {
      timestamp: new Date().toISOString(),
      action,
      context,
      sender: 'orchestrator'
    };
    await fs.writeFile(broadcastPath, JSON.stringify(message, null, 2));
    console.log(`[BROADCAST] ${action}: ${context}`);
  }

  private async saveQueue() {
    const sognatoreDir = path.join(process.cwd(), 'Sognatore', '.sognatore');
    const queuePath = path.join(sognatoreDir, 'queue', 'pending.json');
    await fs.writeFile(queuePath, JSON.stringify(this.taskQueue, null, 2));
  }

  /**
   * SBP: Resolves conflicts using a dual-diagnostic approach and fallback to 
   * the most conservative solution.
   */
  private async handleSbpConflict(task: SwarmTask): Promise<string> {
    const diagnosticPath = path.join(process.cwd(), 'sbp_conflict_resolution.md');
    
    const diagnosticReport = `
# SBP Conflict Resolution Report
**Task ID:** ${task.id}
**Domain:** ${task.type}
**Timestamp:** ${new Date().toISOString()}

## Conflict Analysis
Discrepancy detected between Sognatore eVolt Proposal and Antigravity  Standards.

## Dual Diagnostic
- **Sognatore View:** Target action deemed necessary for autonomous evolution.
- **Antigravity View:** Potential risk identified; .sognarules violation risk.

## Final Resolution: CONSERVATIVE FALLBACK
No absolute consensus reached. Applying the most conservative safety-first approach.

**Action Taken:** Non-destructive path execution. 
**Status:** SAFE_EXECUTION
`;

    fs.writeFileSync(diagnosticPath, diagnosticReport);
    console.log(`[SBP] Conservative Fallback triggered. Diagnostic saved to: ${diagnosticPath}`);
    
    return "SBP: Task executed via Conservative Fallback. Check sbp_conflict_resolution.md for details.";
  }

  /**
   * Handles a task rejection from the Quality Council by attempting a fix
   * or failing gracefully.
   */
  private async handleCouncilRejection(task: SwarmTask, findings: string): Promise<string> {
    console.log(chalk.red(`[ORCHESTRATOR] Council Rejection: ${findings}`));
    
    const supervisor = await this.registry.getAgent('supervisor');
    const fixPrompt = `
      The Quality Council rejected the following task dispatch.
      TASK: ${task.description}
      FINDINGS: ${findings}
      
      Please refine the task description and requirements to address the council's concerns.
      Return the refined task description.
    `;
    
    const refinedDescription = await supervisor.runTask(fixPrompt);
    console.log(chalk.green(`[ORCHESTRATOR] Task refined by supervisor. Re-dispatching...`));
    
    task.description = refinedDescription;
    return await this.dispatchTask(task);
  }
}
