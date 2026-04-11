import { Provider } from '../Provider.js';
import { AgentRole } from './AgentTypes.js';
import { StateStore } from '../StateStore.js';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export interface AgentState {
  id: string;
  type: string;
  swarm: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
  lastActive: string;
  stats: {
    tasksCompleted: number;
    tokensUsed: number;
  };
}

export class Agent {
  private state: AgentState;
  private statePath: string;

  constructor(
    public readonly id: string,
    public readonly role: AgentRole,
    public readonly provider: Provider,
    private model: string
  ) {
    this.statePath = path.join(process.cwd(), '.loki', 'state', 'agents', `${this.id}.json`);
    this.state = this.loadState();
  }

  public getProviderName(): string {
    return this.provider.getName();
  }

  async runTask(task: string): Promise<string> {
    this.updateStatus('busy', task);
    
    const systemPrompt = this.buildSystemPrompt();
    const fullPrompt = `System: ${systemPrompt}\n\nTask: ${task}`;

    // Performance and stability observability
    if (fullPrompt.length > 50000) {
      console.warn(chalk.yellow(`[WARN] Large Context detected (${Math.round(fullPrompt.length/1024)}KB). Performance may degrade.`));
    }

    const result = await this.provider.invoke(task, {
      tier: 'development',
      model: this.model,
      system: systemPrompt
    });

    this.state.stats.tasksCompleted++;
    this.updateStatus('idle');
    
    return result;
  }

  private buildSystemPrompt(): string {
    return `
# Agent Identity
You are **${this.role.type}** agent with ID **${this.id}**.
Swarm: ${this.role.swarm}
Model: ${this.model} (2026 Multimodelo Strategy)

## Your Capabilities
${this.role.capabilities.map(c => `- ${c}`).join('\n')}

## Your Task Types
${this.role.taskTypes.map(t => `- ${t}`).join('\n')}

## Quality Checks You Must Perform
${this.role.qualityChecks.map(q => `- ${q}`).join('\n')}

## Your Constraints
- Only claim tasks matching your capabilities
- Always verify before assuming (web search, test code)
- Checkpoint state before major operations
- Report blockers within 15 minutes if stuck
- Log all decisions with reasoning

## Task Execution Loop (High Assurance)
1. Reason: Understand the task deeply
2. Act: Execute the minimal modification or query
3. Reflect: Peer-review your own result
4. Verify: Run tests or validation gates
    `.trim();
  }

  private updateStatus(status: 'idle' | 'busy' | 'error', task?: string) {
    this.state.status = status;
    this.state.currentTask = task;
    this.state.lastActive = new Date().toISOString();
    this.saveState();
  }

  private saveState() {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  private loadState(): AgentState {
    if (fs.existsSync(this.statePath)) {
      return JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
    }
    return {
      id: this.id,
      type: this.role.type,
      swarm: this.role.swarm,
      status: 'idle',
      lastActive: new Date().toISOString(),
      stats: { tasksCompleted: 0, tokensUsed: 0 }
    };
  }

  getMetadata() {
    return {
      id: this.id,
      type: this.role.type,
      swarm: this.role.swarm,
      model: this.model,
      provider: this.provider.metadata.name
    };
  }
}
