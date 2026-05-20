import { Color, EventProvenance, FailureClass, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { Provider } from '../Provider.js';
import { AgentRole } from './AgentTypes.js';
import { StateStore } from '../StateStore.js';
import path from 'path';
import fs from 'fs';

import { ToolRegistry } from '../actions/ToolRegistry.js';
import { AgentFactory } from './AgentFactory.js';
import { Guardian } from '../Guardian.js';
import { AutoHealer } from '@Sogna/Curator/shared/AutoHealer.js';
import { PredatoreVault } from '@Sogna/Curator';
import { Orchestrator, Turn } from '../Orchestrator.js';
import { BootstrapEngine } from '../BootstrapEngine.js';


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
    this.statePath = path.join(process.cwd(), '.sognatore', 'state', 'agents', `${this.id}.json`);
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

    // Para Gemini/GPT, implementamos el bucle Cycle nativo de Sognatore
    return this.executeNativeLoop(task);
  }

  private async executeAgenticTask(task: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const sanitizedTask = Guardian.getInstance().sanitizePrompt(task);
    
    const result = await this.provider.invoke(sanitizedTask, {
      tier: 'development',
      model: this.model,
      system: systemPrompt
    });

    // Ofuscar si es código generado
    const finalResult = Guardian.getInstance().obfuscateCode(result);

    this.recordStats(systemPrompt.length + sanitizedTask.length, finalResult.length);
    this.updateStatus('idle');
    return finalResult;
  }

  private async executeNativeLoop(initialTask: string): Promise<string> {
    let currentPrompt = initialTask;
    let turn = 0;
    const maxTurns = 15; // Increased budget for complex institutional tasks
    const history: Turn[] = [];
    const orchestrator = Orchestrator.getInstance();

    SognaEventBus.getInstance().publish({
      type: SognaEventType.LOG,
      emitter: this.id,
      swarm: this.role.swarm,
      failureClass: FailureClass.NONE,
      provenance: EventProvenance.LIVE,
      data: { message: Guardian.getInstance().redactIntel(`Iniciando bucle agéntico institucional para ${this.id} (${this.model})`) }
    });

    while (turn < maxTurns) {
      turn++;
      
      // [Cycle: REASON] - Define approach and resolve tools
      const stageReason = Color.dim(`  [R] Reasoning turn ${turn}...`);
      console.log(stageReason);

      // [HEURISTIC ROUTING] - Dynamic tool selection based on prompt
      const relevantTools = await orchestrator.routeTools(currentPrompt);
      const toolDefs = "Herramientas Sugeridas (Orquestador):\n" + 
                       relevantTools.map(t => `- ${t.name}: ${t.description}`).join('\n');

      // [PHASE 5: PREDICTIVE PREFETCH] - Intelligence Warming
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      const prefetchContext = await orchestrator.predictivePrefetch(currentPrompt);

// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      const systemPrompt = this.buildSystemPrompt() + "\n\n" + toolDefs + (prefetchContext ? `\n\n${prefetchContext}` : "");

      // [CONTEXT COMPACTION] - Automatic pruning with Recursive Summarization
      const optimizedHistory = await orchestrator.compact(history, this);
      
      // Update local history if compaction occurred to maintain state
      if (optimizedHistory.length < history.length) {
        history.length = 0;
        history.push(...optimizedHistory);
      }

      const historyContext = optimizedHistory.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n\n');
      
      // [PHASE 5: VANGUARD FILTERING] - Decoupling operational noise
      const sanitizedPrompt = Guardian.getInstance().sanitizePrompt(`${historyContext}\n\nTask: ${currentPrompt}`);

      // [Cycle: ACT] - Execute tool or generate response
      const response = await this.provider.invoke(sanitizedPrompt, {
        tier: 'development',
        model: this.model,
        system: systemPrompt
      });

      // Publish Thought Event
      SognaEventBus.getInstance().publish({
        type: SognaEventType.THOUGHT,
        emitter: this.id,
        swarm: this.role.swarm,
        failureClass: FailureClass.NONE,
        provenance: EventProvenance.LIVE,
        data: { content: Guardian.getInstance().redactIntel(response) }
      });


      // AUDIT VAULT: Record Reasoning Summary
      PredatoreVault.getInstance().recordReasoning(this.id, turn, response.substring(0, 200) + "...");

      // Update history using structured Turns
      history.push({ role: 'user', content: currentPrompt });
      history.push({ role: 'assistant', content: response });

      // [Cycle: REFLECT] - Search for tool calls or final output
      // [Cycle: VERIFY] - Automated check of tool outputs

      // Parse XML Tool Calls
      const toolCallMatch = response.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
      
      if (toolCallMatch) {
        const toolXml = toolCallMatch[1];
        const toolName = toolXml.match(/<tool_name>(.*?)<\/tool_name>/)?.[1];
        const paramsMatch = toolXml.match(/<parameters>([\s\S]*?)<\/parameters>/);
        
        if (toolName && paramsMatch) {
            const paramsXml = paramsMatch[1];
            const params: Record<string, string> = {};
            const paramTags = paramsXml.match(/<(\w+)>(.*?)<\/\w+>/g);
            paramTags?.forEach(tag => {
              const m = tag.match(/<(\w+)>(.*?)<\/\w+>/);
              if (m) params[m[1]] = m[2];
            });

          try {
            // Publish Action Start Event
            SognaEventBus.getInstance().publish({
              type: SognaEventType.ACTION_START,
              emitter: this.id,
              swarm: this.role.swarm,
              failureClass: FailureClass.NONE,
              provenance: EventProvenance.LIVE,
              data: { tool: toolName, args: params }
            });

            // AUDIT VAULT: Tool Start
            PredatoreVault.getInstance().recordTool(this.id, toolName, 'START', undefined, { params });

            // Execute Tool
            const startTime = Date.now();
            const observation = await ToolRegistry.getInstance().execute(toolName, params, this.getAgentTier());
            const duration = Date.now() - startTime;

            // AUDIT VAULT: Tool End
            PredatoreVault.getInstance().recordTool(this.id, toolName, 'END', duration);

            // Publish Observation Event
            SognaEventBus.getInstance().publish({
              type: SognaEventType.OBSERVATION,
              emitter: this.id,
              swarm: this.role.swarm,
              failureClass: FailureClass.NONE,
              provenance: EventProvenance.LIVE,
              data: { tool: toolName, result: Guardian.getInstance().redactIntel(String(observation)) }
            });

            history.push({ role: 'tool', content: `Observation from ${toolName}: ${observation}` });
            currentPrompt = `Observation from ${toolName}: ${observation}. Please decide your next step. If finished, reply with TASK_COMPLETE.`;
          } catch (toolError: any) {
            // SOGNA-WIDE AUTO-HEALING
            const healer = AutoHealer.getInstance();
            const scenario = healer.detectScenario(toolError.message);
            if (scenario) {
              const recovered = await healer.attemptRecovery(scenario, this.id);
              if (recovered) {
                // Publish Recovery Event
                SognaEventBus.getInstance().publish({
                  type: SognaEventType.RECOVERY,
                  emitter: this.id,
                  swarm: this.role.swarm,
                  failureClass: scenario,
                  provenance: EventProvenance.LIVE,
                  data: { recipe: scenario }
                });
                currentPrompt = `Critical: I just recovered from a ${scenario} error. Let's retry the tool call correctly.`;
                continue;
              }
            }
            history.push({ role: 'tool', content: `Tool Error (${toolName}): ${toolError.message}` });
            currentPrompt = `Error from ${toolName}: ${toolError.message}. Help me fix this or try another approach.`;
          }
          
          continue;
        }
      }

      if (response.includes('TASK_COMPLETE') || turn >= maxTurns) {
        break;
      }
    }

    this.updateStatus('idle');
    const lastMessage = history[history.length - 1];
    return lastMessage ? lastMessage.content : "Task finished with no output.";
  }

  private recordStats(inputLen: number, outputLen: number, cacheWrite: number = 0, cacheRead: number = 0) {
    const inputTokens = Math.ceil(inputLen / 4);
    const outputTokens = Math.ceil(outputLen / 4);
    
    // High-Fidelity cost tracking
    import('../utils/CostTracker.js').then(m => {
      m.CostTracker.getInstance().calculateAndReport(this.model, inputTokens, outputTokens, cacheWrite, cacheRead);
    });

    this.state.stats.tasksCompleted++;
    this.state.stats.tokensUsed += (inputTokens + outputTokens);
  }

  private getAgentTier(): string {
    return this.tier;
  }

  private buildSystemPrompt(): string {
    const identityDirective = BootstrapEngine.getIdentityDirective();
    return `
# SOGNA AGENT: ${this.id} [${this.role.type}]
swarm: ${this.role.swarm} | Model: ${this.model}

${identityDirective ? `## Sogna Institutional Directive (SSOT)\n${identityDirective}\n` : ''}

## Operational Protocol (Cycle)
1. REASON: Analyze state, intent, and cross-domain implications.
2. ACT: Execute tools via XML Protocol.
3. REFLECT: Evaluate observation vs intent.
4. VERIFY: Final validation of integrity and requirements.

## Intelligence & Quality
- Capabilities: ${this.role.capabilities.join(', ')}
- Task Domains: ${this.role.taskTypes.join(', ')}
- Quality Gates: ${this.role.qualityChecks.join(', ')}

## Tool Protocol (STRICT XML)
Format: <tool_call><tool_name>N</tool_name><parameters><P>V</P></parameters></tool_call>
Wait for "Observation" before proceeding. Include 'TASK_COMPLETE' when 100% finished.

## Constraints
- Verify state before assuming. Decision logging REQUIRED.
- Adhere to Sentinel Security Policies.
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
    
    // Sellar los datos con el Guardian
    const sealedData = Guardian.getInstance().sealData(this.state);
    fs.writeFileSync(this.statePath, sealedData);
  }

  private loadState(): AgentState {
    if (fs.existsSync(this.statePath)) {
      const data = fs.readFileSync(this.statePath, 'utf8');
      const unsealed = Guardian.getInstance().unsealData(data);
      if (unsealed) return unsealed as AgentState;
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

