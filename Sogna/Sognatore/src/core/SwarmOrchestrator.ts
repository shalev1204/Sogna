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
   * Dispatches a task to los departamentos dept/ vía DeptSwarmRegistry.
   */
  public async dispatchTask(task: swarmTask): Promise<void> {
    const { DeptSwarmRegistry } = await import('./dept/DeptSwarmRegistry.js');
    const semanticLabels = await this.semanticRoute(task.description);
    const departments = DeptSwarmRegistry.resolveDepartments(task, semanticLabels);

    this.bus.emit(SognaEventType.LOG, {
      emitter: `SwarmOrchestrator`,
      data: { message: `Dispatching task ${task.id} to departments: ${departments.join(', ')}` },
    });
    console.log(Color.cyan(`[swarm] Dispatching task ${task.id} (${task.type}) → [${departments.join(', ')}]`));
    this.tasks.push({ ...task, status: 'in_progress' });

    const results: Record<string, unknown> = {};
    for (const dept of departments) {
      const swarm = await DeptSwarmRegistry.get(dept);
      if (!swarm) continue;
      try {
        results[dept] = await swarm.process(task.description);
        console.log(Color.green(`[swarm] Department ${dept} completed task ${task.id}`));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results[dept] = { error: message };
        console.error(Color.red(`[swarm] Department ${dept} failed: ${message}`));
        this.bus.emit(SognaEventType.ERROR, {
          emitter: `SwarmOrchestrator:${dept}`,
          data: { message, taskId: task.id },
        });
      }
    }

    const failed = Object.values(results).some((r) => r && typeof r === 'object' && 'error' in (r as object));
    const finalTask = this.tasks.find((t) => t.id === task.id);
    if (finalTask) {
      finalTask.status = failed ? 'failed' : 'completed';
    }

    this.bus.emit(SognaEventType.LOG, {
      emitter: `SwarmOrchestrator`,
      data: { message: `Task ${task.id} ${failed ? 'failed' : 'completed'} across ${departments.length} department(s)` },
    });
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
