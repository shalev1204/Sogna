import { Provider } from '../Provider.js';
import { AgentRole } from './AgentTypes.js';
import { StateStore } from '../StateStore.js';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { ToolRegistry } from '../actions/ToolRegistry.js';
import { AgentFactory } from './AgentFactory.js';

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
    private model: string,
    private tier: string
  ) {
    this.statePath = path.join(process.cwd(), '.loki', 'state', 'agents', `${this.id}.json`);
    this.state = this.loadState();
  }

  public getProviderName(): string {
    return this.provider.getName();
  }

  async runTask(task: string): Promise<string> {
    this.updateStatus('busy', task);
    
    // Si es Claude, delegamos la autonomía a su CLI nativo (ya es agentico)
    if (this.provider.metadata.name === 'claude') {
      return this.executeAgenticTask(task);
    }

    // Para Gemini/GPT, implementamos el bucle RARV nativo de Loki
    return this.executeNativeLoop(task);
  }

  private async executeAgenticTask(task: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const result = await this.provider.invoke(task, {
      tier: 'development',
      model: this.model,
      system: systemPrompt
    });

    this.recordStats(systemPrompt.length + task.length, result.length);
    this.updateStatus('idle');
    return result;
  }

  private async executeNativeLoop(initialTask: string): Promise<string> {
    let currentPrompt = initialTask;
    let turn = 0;
    const maxTurns = 10;
    const history: string[] = [];
    const systemPrompt = this.buildSystemPrompt() + "\n\n" + ToolRegistry.getInstance().getToolsDefinition();

    console.log(chalk.blue(`[LOKI-LOOP] Iniciando bucle agéntico para ${this.id} (${this.model})`));

    while (turn < maxTurns) {
      turn++;
      const fullPrompt = history.length > 0 
        ? `Task Context:\n${history.join('\n\n')}\n\nContinue Task: ${currentPrompt}`
        : currentPrompt;

      const response = await this.provider.invoke(fullPrompt, {
        tier: 'development',
        model: this.model,
        system: systemPrompt
      });

      this.recordStats(systemPrompt.length + fullPrompt.length, response.length);
      history.push(`> User: ${currentPrompt}`, `> Agent: ${response}`);

      // Parse XML Tool Calls
      const toolCallMatch = response.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
      
      if (toolCallMatch) {
        const toolXml = toolCallMatch[1];
        const toolName = toolXml.match(/<tool_name>(.*?)<\/tool_name>/)?.[1];
        const paramsMatch = toolXml.match(/<parameters>([\s\S]*?)<\/parameters>/);
        
        if (toolName && paramsMatch) {
          const paramsXml = paramsMatch[1];
          const params: any = {};
          // Basic parameter extraction from XML-ish format
          const paramTags = paramsXml.match(/<(\w+)>(.*?)<\/\w+>/g);
          paramTags?.forEach(tag => {
            const m = tag.match(/<(\w+)>(.*?)<\/\w+>/);
            if (m) params[m[1]] = m[2];
          });

          // Execute Tool
          const observation = await ToolRegistry.getInstance().call(toolName, params, this.getAgentTier());
          history.push(`> Observation (${toolName}): ${observation}`);
          currentPrompt = `Observation from ${toolName}: ${observation}. Please decide your next step. If finished, reply with TASK_COMPLETE.`;
          continue;
        }
      }

      if (response.includes('TASK_COMPLETE') || turn >= maxTurns) {
        break;
      }
    }

    this.updateStatus('idle');
    return history[history.length - 1];
  }

  private recordStats(inputLen: number, outputLen: number) {
    const inputTokens = Math.ceil(inputLen / 4);
    const outputTokens = Math.ceil(outputLen / 4);
    
    // Report to central cost tracker
    import('../utils/CostTracker.js').then(m => {
      m.CostTracker.getInstance().calculateAndReport(this.model, inputTokens, outputTokens);
    });

    this.state.stats.tasksCompleted++;
    this.state.stats.tokensUsed += (inputTokens + outputTokens);
  }

  private getAgentTier(): string {
    return this.tier;
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

## Tool Use Protocol (XML REQUIRED)
If you need to perform an action, you MUST use the following XML format:
<tool_call>
  <tool_name>name_of_the_tool</tool_name>
  <parameters>
    <param_name>value</param_name>
  </parameters>
</tool_call>

Wait for the "Observation" from the system before proceeding. 
When the task is 100% finished, include the keyword TASK_COMPLETE in your final response.

## Your Constraints
- Only claim tasks matching your capabilities
- Always verify before assuming (web search, test code)
- Checkpoint state before major operations
- Log all decisions with reasoning

## Task Execution Loop (RARV)
1. Reason: Analyze the state and decide the next action
2. Act: Call the appropriate tool
3. Reflect: Analyze the tool's observation
4. Verify: Ensure the result matches the requirement
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
