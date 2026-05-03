import { execa, ExecaChildProcess } from 'execa';
import { SognaEventBus, SognaEventType, EventProvenance, FailureClass } from '@sogna/curator';
import chalk from 'chalk';

export interface TaskPacket {
  id: string;
  command: string;
  startTime: number;
  status: 'running' | 'completed' | 'failed';
  output: string[];
  process: ExecaChildProcess;
}

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private tasks: Map<string, TaskPacket> = new Map();

  private constructor() {}

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  /**
   * Starts a command in the background.
   */
  public async startTask(id: string, command: string, cwd: string): Promise<string> {
    if (this.tasks.has(id)) {
      throw new Error(`Task with ID "${id}" is already running.`);
    }

    console.log(chalk.blue(`[TASK] Starting background task "${id}": ${command}`));

    const childProcess = execa(command, {
      shell: true,
      cwd,
      all: true,
    });

    const packet: TaskPacket = {
      id,
      command,
      startTime: Date.now(),
      status: 'running',
      output: [],
      process: childProcess,
    };

    this.tasks.set(id, packet);

    const bus = SognaEventBus.getInstance();

    // Stream output to EventBus and internal buffer
    childProcess.all?.on('data', (data) => {
      const line = data.toString().trim();
      if (line) {
        packet.output.push(line);
        // Limit buffer size to 500 lines for efficiency
        if (packet.output.length > 500) packet.output.shift();

        bus.publish({
          type: SognaEventType.LOG,
          emitter: `BackgroundTask:${id}`,
          data: { message: line },
          provenance: EventProvenance.LIVE,
          failureClass: FailureClass.NONE
        });
      }
    });

    childProcess.then((result) => {
      packet.status = 'completed';
      bus.publish({
        type: SognaEventType.LOG,
        emitter: `BackgroundTask:${id}`,
        data: { message: `Task completed successfully.`, exitCode: result.exitCode },
        provenance: EventProvenance.LIVE,
        failureClass: FailureClass.NONE
      });
    }).catch((err) => {
      packet.status = 'failed';
      bus.publish({
        type: SognaEventType.ERROR,
        emitter: `BackgroundTask:${id}`,
        data: { message: `Task failed: ${err.message}`, exitCode: err.exitCode },
        provenance: EventProvenance.LIVE,
        failureClass: FailureClass.INFRA
      });
    });

    return `Task "${id}" started successfully in background. PID: ${childProcess.pid}`;
  }

  public getTask(id: string): TaskPacket | undefined {
    return this.tasks.get(id);
  }

  public listTasks(): string[] {
    return Array.from(this.tasks.keys()).map(id => {
      const t = this.tasks.get(id)!;
      return `${id} [${t.status}] - ${t.command}`;
    });
  }

  public async stopTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.status === 'running') {
      task.process.kill();
      task.status = 'failed';
    }
  }
}
