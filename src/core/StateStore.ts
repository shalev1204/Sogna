import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export interface LokiState {
  sessionId: string;
  projectName: string;
  currentIteration: number;
  currentPhase: 'reason' | 'act' | 'reflect' | 'verify';
  status: 'active' | 'paused' | 'stopped' | 'error';
  startTime: string;
  totalTokens: number;
  totalCost: number;
}

export class StateStore {
  private lokiDir: string;
  private stateFile: string;

  constructor(baseDir: string = '.') {
    this.lokiDir = path.resolve(baseDir, '.loki');
    this.stateFile = path.join(this.lokiDir, 'state', 'session.json');
  }

  async init(projectName: string): Promise<LokiState> {
    await fs.ensureDir(this.lokiDir);
    await fs.ensureDir(path.join(this.lokiDir, 'state'));
    await fs.ensureDir(path.join(this.lokiDir, 'locks'));
    await fs.ensureDir(path.join(this.lokiDir, 'logs'));
    await fs.ensureDir(path.join(this.lokiDir, 'agents'));

    let state: LokiState;

    if (await fs.pathExists(this.stateFile)) {
      state = await fs.readJson(this.stateFile);
    } else {
      state = {
        sessionId: `session_${Date.now()}`,
        projectName,
        currentIteration: 1,
        currentPhase: 'reason',
        status: 'active',
        startTime: new Date().toISOString(),
        totalTokens: 0,
        totalCost: 0
      };
      await this.saveState(state);
    }

    return state;
  }

  async saveState(state: LokiState): Promise<void> {
    // Atomic write on Windows is safer via temp file + rename
    const tempFile = `${this.stateFile}.tmp`;
    await fs.writeJson(tempFile, state, { spaces: 2 });
    await fs.move(tempFile, this.stateFile, { overwrite: true });
  }

  async getLogPath(agentName: string, iteration: number): Promise<string> {
    const logDir = path.join(this.lokiDir, 'logs', `it${iteration}`);
    await fs.ensureDir(logDir);
    return path.join(logDir, `${agentName}.log`);
  }

  getLokiDir(): string {
    return this.lokiDir;
  }
}
