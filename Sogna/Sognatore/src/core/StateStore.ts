import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export interface SognatoreState {
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
  private sognatoreDir: string;
  private stateFile: string;

  constructor(baseDir: string = '.') {
    this.sognatoreDir = path.resolve(baseDir, '.sognatore');
    this.stateFile = path.join(this.sognatoreDir, 'state', 'session.json');
  }

  async init(projectName: string): Promise<SognatoreState> {
    await fs.ensureDir(this.sognatoreDir);
    await fs.ensureDir(path.join(this.sognatoreDir, 'state'));
    await fs.ensureDir(path.join(this.sognatoreDir, 'locks'));
    await fs.ensureDir(path.join(this.sognatoreDir, 'logs'));
    await fs.ensureDir(path.join(this.sognatoreDir, 'agents'));

    let state: SognatoreState;

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

  async saveState(state: SognatoreState): Promise<void> {
    // Atomic write on Windows is safer via temp file + rename
    const tempFile = `${this.stateFile}.tmp`;
    await fs.writeJson(tempFile, state, { spaces: 2 });
    await fs.move(tempFile, this.stateFile, { overwrite: true });
  }

  async getLogPath(agentName: string, iteration: number): Promise<string> {
    const logDir = path.join(this.sognatoreDir, 'logs', `it${iteration}`);
    await fs.ensureDir(logDir);
    return path.join(logDir, `${agentName}.log`);
  }

  getSognatoreDir(): string {
    return this.sognatoreDir;
  }
}
