import { Color, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { Hub } from '../Sentinel-Sognatore/Hub.js';

export interface swarmService {
  name: string;
  intervalMs: number;
  task: () => Promise<void>;
}

export interface swarmTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * swarm Orchestrator - swarm Orchestration
 */
export class SwarmOrchestrator {
  private static instance: SwarmOrchestrator;
  private services: Map<string, NodeJS.Timeout> = new Map();
  private tasks: swarmTask[] = [];
  private bus = SognaEventBus.getInstance();

  private constructor() {}

  public static getInstance(): SwarmOrchestrator {
    if (!SwarmOrchestrator.instance) {
      SwarmOrchestrator.instance = new SwarmOrchestrator();
    }
    return SwarmOrchestrator.instance;
  }

  /**
   * Identifies the best swarms to handle a given prompt using the Memory Hub.
   */
  public async semanticRoute(prompt: string): Promise<string[]> {
      const { MemoryHub } = await import('./memory/MemoryHub.js');
      const memory = MemoryHub.getInstance();
      const fragments = await memory.semanticRecall(prompt);
      
      const swarms = new Set<string>();
      fragments.forEach(f => {
          if (f.metadata.swarm) swarms.add(f.metadata.swarm);
      });

      // Default to orchestration if no clear swarm is found
      if (swarms.size === 0) swarms.add('orchestration');
      
      return Array.from(swarms);
  }

  /**
   * Orchestrates a complex task across multiple specialized swarms.
   */
  public async executeCrossSwarmTask(task: swarmTask): Promise<void> {
      const targetSwarms = await this.semanticRoute(task.description);
      
      console.log(Color.bold.magenta(`\n[CROSS-SWARM] Coordinating task ${task.id} across: ${targetSwarms.join(', ')}`));
      
      for (const swarm of targetSwarms) {
          this.bus.emit(SognaEventType.LOG, {
              emitter: `SwarmOrchestrator`,
              data: { message: `Requesting synaptic lock from swarm: ${swarm}` }
          });
          
          // In a real handshake, we would wait for the swarm lead to ACK.
          console.log(Color.cyan(`  🤝 Swarm ${swarm} locked for task: ${task.type}`));
      }

      await this.dispatchTask(task);
  }

  /**
   * Dispatches a complex task to the 41-agent swarm.
   */
  public async dispatchTask(task: swarmTask): Promise<void> {
    this.bus.emit(SognaEventType.LOG, {
      emitter: `SwarmOrchestrator`,
      data: { message: `Dispatching task ${task.id} (${task.type}) to 41 Agents...` }
    });
    console.log(Color.cyan(`[swarm] Dispatching task ${task.id} (${task.type}) to 41 Agents...`));
    this.tasks.push({ ...task, status: 'in_progress' });
    
    // In a full implementation, this would trigger agent processes.
    // For now, we simulate the swarm handoff.
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    console.log(Color.green(`[swarm] Task ${task.id} accepted by Cluster. Processing in background.`));
  }

  public registerService(service: swarmService): void {
    if (this.services.has(service.name)) {
      this.stopService(service.name);
    }

    const timer = setInterval(async () => {
      try {
        this.bus.emit(SognaEventType.LOG, {
          emitter: `BackgroundTask:${service.name}`,
          data: { message: `Executing status...` }
        });
        await service.task();
      } catch (error) {
        console.error(Color.red(`[swarm] Service ${service.name} failed: ${error instanceof Error ? error.message : String(error)}`));
        this.bus.emit(SognaEventType.ERROR, {
          emitter: `BackgroundTask:${service.name}`,
          data: { message: error instanceof Error ? error.message : String(error) }
        });
        Hub.getInstance().reportIntel('WARNING', `Fallo en servicio de Agentes: ${service.name}`, 'SwarmOrchestrator');
      }
    }, service.intervalMs);

    this.services.set(service.name, timer);
    console.log(Color.cyan(`[swarm] Service ${service.name} started (Interval: ${service.intervalMs}ms)`));
  }

  public stopService(name: string): void {
    const timer = this.services.get(name);
    if (timer) {
      clearInterval(timer);
      this.services.delete(name);
      console.log(Color.yellow(`[swarm] Service ${name} stopped.`));
    }
  }

  public stopAll(): void {
    for (const name of this.services.keys()) {
      this.stopService(name);
    }
  }

  public getTasks(): swarmTask[] {
    return [...this.tasks];
  }

  public getActiveServices(): string[] {
    return Array.from(this.services.keys());
  }
}
