import { Color, Exec, SognaChildProcess, FS as fs } from '@Sogna/Curator';



import path from 'path';

export interface ExecutionOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  logFile?: string;
  timeout?: number;
}

export class Supervisor {
  private activeProcesses: Map<string, SognaChildProcess> = new Map();

  constructor() {
    // Handle Ctrl+C for clean process termination
    process.on('SIGINT', () => this.terminateAll('SIGINT'));
    process.on('SIGTERM', () => this.terminateAll('SIGTERM'));
  }

  async runAgent(agentName: string, command: string, args: string[], options: ExecutionOptions = {}): Promise<string> {
    const processId = `${agentName}_${Date.now()}`;
    
    console.log(Color.blue(`\n[AGENT] Starting ${agentName}...`));
    
    const childProcess = Exec.run(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 300000, // 5 min default
      all: true, // Buffer both stdout and stderr
    });

    this.activeProcesses.set(processId, childProcess);

    let logStream: any;

    // Stream output to log file if provided
    if (options.logFile) {
      await fs.ensureDir(path.dirname(options.logFile));
      logStream = fs.createWriteStream(options.logFile, { flags: 'a' });
      childProcess.all?.pipe(logStream);
    }

    try {
      const { all } = await childProcess;
      this.activeProcesses.delete(processId);
      return all || '';
    } catch (error: unknown) {
      this.activeProcesses.delete(processId);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Agent ${agentName} failed: ${message}`, { cause: error });
    } finally {
      if (logStream) {
        logStream.end();
      }
    }
  }

  terminateAll(signal: NodeJS.Signals) {
    if (this.activeProcesses.size === 0) return;

    console.log(Color.yellow(`\n[SUPERVISOR] Terminating ${this.activeProcesses.size} active processes (${signal})...`));
    
    for (const [id, proc] of this.activeProcesses) {
      proc.kill(signal);
      this.activeProcesses.delete(id);
    }
  }
}
