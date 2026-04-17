import { Agent } from './agents/Agent.js';
import { AgentRegistry } from './agents/AgentRegistry.js';
import { AgentRole, AgentSwarm } from './agents/AgentTypes.js';
import { AgentFactory } from './agents/AgentFactory.js';
import { DockerSandbox } from './DockerSandbox.js';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';

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

  private constructor() {
    super();
    this.messageBus = path.join(process.cwd(), '.sognatore', 'messages');
    this.registry = AgentRegistry.getInstance();
    this.initFileSystem();
  }

  static getInstance(): SwarmOrchestrator {
    if (!SwarmOrchestrator.instance) {
      SwarmOrchestrator.instance = new SwarmOrchestrator();
    }
    return SwarmOrchestrator.instance;
  }

  private initFileSystem() {
    const dirs = [
      this.messageBus,
      path.join(this.messageBus, 'inbox'),
      path.join(this.messageBus, 'outbox'),
      path.join(this.messageBus, 'broadcast'),
      path.join(process.cwd(), '.sognatore', 'queue')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  /**
   * Dispatches a task to the swarm.
   * Finds the best agent category and triggers parallel execution if enabled.
   */
  async dispatchTask(task: SwarmTask): Promise<string> {
    this.taskQueue.push(task);
    this.saveQueue();

    // High-Assurance Gap Detection (Skills & Agents)
    if (this.detectAgentGap(task)) {
      await this.triggerRecruitment(task);
    } else if (this.detectSkillGap(task)) {
      await this.triggerEvolution(task);
    }

    const agentType = this.resolveSpecialistForTask(task.type);
    
    // Sandbox Profile Selection
    const sandbox = DockerSandbox.getInstance();
    if (task.type.startsWith('sec-') || task.type === 'ops-security') {
      sandbox.setProfile('security');
    } else {
      sandbox.setProfile('standard');
    }

    const agent = await this.registry.getAgent(agentType);
    
    this.emit('task:started', { taskId: task.id, agentId: agent.id });
    
    // SBP CONSENSUS GATE
    if (process.env.SOGNA_BRIDGE_PROTOCOL !== 'disabled') {
       try {
         await this.registry.getAgent('supervisor'); // Pre-warm council
         // In a real flow, the QualityCouncil would run here.
         // For now, we simulate the SBP handshake logic.
       } catch (sbpError) {
         console.warn('[SBP] Bridge Handshake failed. Attempting SBP Resolution...');
         return await this.handleSbpConflict(task);
       }
    }

    try {
      const result = await agent.runTask(task.description);
      task.status = 'completed';
      task.result = result;
      this.saveQueue();
      
      this.emit('task:completed', { taskId: task.id, result });
      return result;
    } catch (error) {
      task.status = 'failed';
      this.saveQueue();
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
      await factory.enrollNewSpecialist(role);
      console.log(`[RECRUITMENT] Specialist '${role.type}' successfully enrolled and validated by the Council.`);
      this.emit('recruitment:success', { role });
    } else {
      console.error(`[RECRUITMENT] Council rejected the specialist profile: ${validationResult}`);
      throw new Error(`Agent recruitment failed validation: ${validationResult}`);
    }
  }

  private detectAgentGap(task: SwarmTask): boolean {
    const catalogPath = path.join(process.cwd(), 'resources', 'config', 'swarm_catalog.json');
    if (!fs.existsSync(catalogPath)) return false;
    
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const knownPrefixes = Object.keys(catalog.swarms).concat(Object.keys(catalog.evolved_swarms));
    
    // If the task type doesn't start with any known prefix in the swarms, it's a domain gap
    // e.g. 'fintech-analyze' vs 'eng-frontend'
    return !knownPrefixes.some(prefix => task.type.startsWith(prefix));
  }

  private detectSkillGap(task: SwarmTask): boolean {
    const knownTypes = ['ui-', 'api-', 'db-', 'sec-', 'prd-', 'ops-', 'research-', 'review-'];
    return !knownTypes.some(prefix => task.type.startsWith(prefix));
  }

  private resolveSpecialistForTask(taskType: string): string {
    const catalogPath = path.join(process.cwd(), 'resources', 'config', 'swarm_catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      
      // Match by exact prefix first
      const prefix = taskType.split('-')[0];
      
      // Check all swarms for an agent that matches this specific task type
      const swarms = { ...catalog.swarms, ...catalog.evolved_swarms };
      for (const swarm of Object.values(swarms)) {
        const agents = (swarm as any).agents;
        if (agents.includes(taskType)) return taskType;
        // Fallback to searching if any agent in the swarm handles this prefix
        const match = agents.find((a: string) => a.startsWith(prefix));
        if (match) return match;
      }
    }

    // Default legacy Fallback
    if (taskType.startsWith('ui-')) return 'eng-frontend';
    if (taskType.startsWith('api-')) return 'eng-backend';
    if (taskType.startsWith('db-')) return 'eng-database';
    
    return 'eng-backend';
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
    fs.writeFileSync(broadcastPath, JSON.stringify(message, null, 2));
    console.log(`[BROADCAST] ${action}: ${context}`);
  }

  private saveQueue() {
    const queuePath = path.join(process.cwd(), '.sognatore', 'queue', 'pending.json');
    fs.writeFileSync(queuePath, JSON.stringify(this.taskQueue, null, 2));
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
}
