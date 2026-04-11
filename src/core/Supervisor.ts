import { execa, type ExecaChildProcess } from 'execa';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export interface ExecutionOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  logFile?: string;
  timeout?: number;
}

export class Supervisor {
  private activeProcesses: Map<string, ExecaChildProcess> = new Map();

  constructor() {
    // Handle Ctrl+C for clean process termination
    process.on('SIGINT', () => this.terminateAll('SIGINT'));
    process.on('SIGTERM', () => this.terminateAll('SIGTERM'));
  }

  async runAgent(agentName: string, command: string, args: string[], options: ExecutionOptions = {}): Promise<string> {
    const processId = `${agentName}_${Date.now()}`;
    
    console.log(chalk.blue(`\n[AGENT] Starting ${agentName}...`));
    
    const childProcess = execa(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 300000, // 5 min default
      all: true, // Buffer both stdout and stderr
    });

    this.activeProcesses.set(processId, childProcess);

    // Stream output to log file if provided
    if (options.logFile) {
      await fs.ensureDir(path.dirname(options.logFile));
      const logStream = fs.createWriteStream(options.logFile, { flags: 'a' });
      childProcess.all?.pipe(logStream);
    }

    try {
      const { all } = await childProcess;
      this.activeProcesses.delete(processId);
      return all || '';
    } catch (error: any) {
      this.activeProcesses.delete(processId);
      throw new Error(`Agent ${agentName} failed: ${error.message}`);
    }
  }

  terminateAll(signal: string) {
    if (this.activeProcesses.size === 0) return;

    console.log(chalk.yellow(`\n[SUPERVISOR] Terminating ${this.activeProcesses.size} active processes (${signal})...`));
    
    for (const [id, proc] of this.activeProcesses) {
      proc.kill(signal);
      this.activeProcesses.delete(id);
    }
  }
}
