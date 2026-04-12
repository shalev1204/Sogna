import { Agent } from './agents/Agent.js';
import { AgentRegistry } from './agents/AgentRegistry.js';
import { AgentSwarm } from './agents/AgentTypes.js';
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

    // High-Assurance Gap Detection
    if (this.detectSkillGap(task)) {
      await this.triggerEvolution(task);
    }

    const agentType = this.resolveSpecialistForTask(task.type);
    const agent = await this.registry.getAgent(agentType);
    
    this.emit('task:started', { taskId: task.id, agentId: agent.id });
    
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

  private detectSkillGap(task: SwarmTask): boolean {
    const knownTypes = ['ui-', 'api-', 'db-', 'sec-', 'prd-', 'ops-', 'research-', 'review-'];
    return !knownTypes.some(prefix => task.type.startsWith(prefix));
  }

  private resolveSpecialistForTask(taskType: string): string {
    if (taskType.startsWith('ui-')) return 'eng-frontend';
    if (taskType.startsWith('api-')) return 'eng-backend';
    if (taskType.startsWith('db-')) return 'eng-database';
    if (taskType.startsWith('sec-')) return 'ops-security';
    if (taskType.startsWith('prd-')) return 'prod-pm';
    if (taskType.startsWith('research-') || taskType.startsWith('synthesize-')) return 'orch-researcher';
    
    return 'eng-backend';
  }

  private saveQueue() {
    const queuePath = path.join(process.cwd(), '.sognatore', 'queue', 'pending.json');
    fs.writeFileSync(queuePath, JSON.stringify(this.taskQueue, null, 2));
  }
}
