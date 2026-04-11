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
    this.messageBus = path.join(process.cwd(), '.loki', 'messages');
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
      path.join(process.cwd(), '.loki', 'queue')
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

    // In a high-assurance swarm, we find the specialist
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
   * Broadcasts a message to all agents in the swarm.
   */
  async broadcast(message: string, sender: string) {
    const broadcastDir = path.join(this.messageBus, 'broadcast');
    const msgId = `${Date.now()}-${sender}.json`;
    
    fs.writeFileSync(path.join(broadcastDir, msgId), JSON.stringify({
      sender,
      timestamp: new Date().toISOString(),
      content: message
    }));
  }

  private resolveSpecialistForTask(taskType: string): string {
    // Simple mapping logic: task types often start with the agent prefix (e.g., 'ui-' -> eng-frontend)
    if (taskType.startsWith('ui-')) return 'eng-frontend';
    if (taskType.startsWith('api-')) return 'eng-backend';
    if (taskType.startsWith('db-')) return 'eng-database';
    if (taskType.startsWith('sec-')) return 'ops-security';
    if (taskType.startsWith('prd-')) return 'prod-pm';
    
    // Default to a general engineer if no match
    return 'eng-backend';
  }

  private saveQueue() {
    const queuePath = path.join(process.cwd(), '.loki', 'queue', 'pending.json');
    fs.writeFileSync(queuePath, JSON.stringify(this.taskQueue, null, 2));
  }
}
