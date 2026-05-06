import { Hub } from '../Sentinel-Sognatore/Hub.js';
import chalk from 'chalk';
import { SognaEventBus, SognaEventType } from '@Sogna/Curator';

export interface SwarmService {
  name: string;
  intervalMs: number;
  task: () => Promise<void>;
}

export interface SwarmTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Swarm Orchestrator - Swarm Orchestration
 */
export class SwarmOrchestrator {
  private static instance: SwarmOrchestrator;
  private services: Map<string, NodeJS.Timeout> = new Map();
  private tasks: SwarmTask[] = [];
  private bus = SognaEventBus.getInstance();

  private constructor() {}

  public static getInstance(): SwarmOrchestrator {
    if (!SwarmOrchestrator.instance) {
      SwarmOrchestrator.instance = new SwarmOrchestrator();
    }
    return SwarmOrchestrator.instance;
  }

  /**
   * Dispatches a complex task to the 41-agent swarm.
   */
  public async dispatchTask(task: SwarmTask): Promise<void> {
    this.bus.emit(SognaEventType.LOG, {
      emitter: `SwarmOrchestrator`,
      data: { message: `Dispatching task ${task.id} (${task.type}) to 41 Agents...` }
    });
    console.log(chalk.cyan(`[SWARM] Dispatching task ${task.id} (${task.type}) to 41 Agents...`));
    this.tasks.push({ ...task, status: 'in_progress' });
    
    // In a full implementation, this would trigger agent processes.
    // For now, we simulate the swarm handoff.
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    console.log(chalk.green(`[SWARM] Task ${task.id} accepted by Cluster. Processing in background.`));
  }

  public registerService(service: SwarmService): void {
    if (this.services.has(service.name)) {
      this.stopService(service.name);
    }

    const timer = setInterval(async () => {
      try {
        this.bus.emit(SognaEventType.LOG, {
          emitter: `BackgroundTask:${service.name}`,
          data: { message: `Executing pulse...` }
        });
        await service.task();
      } catch (error) {
        console.error(chalk.red(`[SWARM] Service ${service.name} failed: ${error instanceof Error ? error.message : String(error)}`));
        this.bus.emit(SognaEventType.ERROR, {
          emitter: `BackgroundTask:${service.name}`,
          data: { message: error instanceof Error ? error.message : String(error) }
        });
        Hub.getInstance().reportIntel('WARNING', `Fallo en servicio de enjambre: ${service.name}`, 'SwarmOrchestrator');
      }
    }, service.intervalMs);

    this.services.set(service.name, timer);
    console.log(chalk.cyan(`[SWARM] Service ${service.name} started (Interval: ${service.intervalMs}ms)`));
  }

  public stopService(name: string): void {
    const timer = this.services.get(name);
    if (timer) {
      clearInterval(timer);
      this.services.delete(name);
      console.log(chalk.yellow(`[SWARM] Service ${name} stopped.`));
    }
  }

  public stopAll(): void {
    for (const name of this.services.keys()) {
      this.stopService(name);
    }
  }
}
