import { PredatoreVault, Color, EventProvenance, FailureClass, SognaEventBus, SognaEventType, SummaryCompressor } from '@Sogna/Curator';
import { ToolDefinition, ToolRegistry } from './actions/ToolRegistry.js';

import { Hub } from '../Sentinel-Sognatore/Hub.js';


export interface Turn {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  isSummary?: boolean;
}

export interface swarmService {
  name: string;
  intervalMs: number;
  task: () => Promise<void>;
}

/**
 * Orchestrator - Unified processor of Sogna
 * Centralizes sequential reasoning and concurrent swarm statuss.
 */
export class Orchestrator {
  private static instance: Orchestrator;
  
  // Sequential State
  private readonly MAX_TURNS = 12;
  private readonly TAIL_SIZE = 6;
  
  // swarm State
  private services: Map<string, NodeJS.Timeout> = new Map();
  private bus = SognaEventBus.getInstance();

  private constructor() {
    console.log(Color.bold.blue('[Orchestrator] Core intelligence centralized.'));
    
    // Escuchar el botón de pánico de la telemetría (Dashboard)
    this.bus.subscribe((event) => {
      if (event.type === ('SYSTEM_PAUSE' as any)) {
        console.log(Color.bgRed.white.bold(`[Orchestrator] SYSTEM HALTED: ${event.data?.reason || 'Panic Button Pressed'}`));
        this.stopAll();
        // Podríamos invocar Hub.getInstance().reportIntel aquí también
      }
    });
  }

  static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  // --- SEQUENTIAL ORCHESTRATION ---

  public async routeTools(prompt: string, limit: number = 5): Promise<ToolDefinition[]> {
    const registry = ToolRegistry.getInstance();
    // @ts-expect-error - Accessing private tools for routing
    const allTools: ToolDefinition[] = Array.from(registry.tools.values());
    
    const tokens = prompt.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scoredTools = allTools.map(tool => {
      let score = 0;
      const haystack = [tool.name, tool.responsibility, ...tool.hints].join(' ').toLowerCase();
      for (const token of tokens) { if (haystack.includes(token)) score += 1; }
      return { tool, score };
    });

    const selected = scoredTools
      .filter(st => st.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(st => st.tool);

    const essentials = ['fs_read', 'fs_list'];
    for (const name of essentials) {
        const tool = allTools.find(t => t.name === name);
        if (tool && !selected.includes(tool)) selected.push(tool);
    }

    this.bus.publish({
      type: SognaEventType.LOG,
      emitter: 'Orchestrator',
      provenance: EventProvenance.LIVE,
      failureClass: FailureClass.NONE,
      data: { message: `Routed ${selected.length} tools for the current prompt.` }
    });

    return selected;
  }

  public async compact(history: Turn[], agent: any): Promise<Turn[]> {
    if (history.length < this.MAX_TURNS) return history;

    console.log(Color.yellow(`[Neuro-Compression] Initiating recursive summarization...`));

    const tailStartIndex = history.length - this.TAIL_SIZE;
    let cutIndex = tailStartIndex;

    while (cutIndex > 0) {
      const current = history[cutIndex];
      const previous = history[cutIndex - 1];
      if (current.role === 'tool' || (previous.role === 'assistant' && previous.content.includes('<tool_call>'))) {
        cutIndex--; 
      } else break;
    }

    if (cutIndex <= 0) return history;

    const segmentsToSummarize = history.slice(0, cutIndex);
    const tailSegment = history.slice(cutIndex);

    const rawContext = segmentsToSummarize.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n\n');
    const prunedContext = SummaryCompressor.compress(rawContext, 'Orchestrator').content;

    try {
      const summaryContent = await agent.provider.invoke(`Summarize key technical decisions and findings:\n${prunedContext}`, {
        tier: 'balanced',
        system: "SOGNARE COMPRESSION CORE: Synthesize intelligence."
      });

      return [{ role: 'assistant', content: `[SOGNARE COMPRESSED MEMORY]\n${summaryContent}`, isSummary: true }, ...tailSegment];
    } catch (error) {
      return history;
    }
  }

  public async predictivePrefetch(prompt: string): Promise<string> {
    try {
      const memory = (await import('./memory/MemoryHub.js')).MemoryHub.getInstance();
      const fragments = await memory.unifiedRecall(prompt);
      
      if (fragments.length === 0) return '';

      return "\n### PREDICTIVE CONTEXT (Intelligence Warming):\n" + 
             fragments.slice(0, 3).map(f => `[${f.source}] ${f.key}: ${f.content.substring(0, 300)}`).join('\n---\n');
    } catch (e) {
      return '';
    }
  }

  // --- CONCURRENT swarm ORCHESTRATION ---

  public registerService(service: swarmService): void {
    if (this.services.has(service.name)) this.stopService(service.name);

    const timer = setInterval(async () => {
      try {
        this.bus.publish({
          type: SognaEventType.LOG,
          emitter: `BackgroundTask:${service.name}`,
          provenance: EventProvenance.HEALTH,
          failureClass: FailureClass.NONE,
          data: { message: `Executing status...` }
        });
        await service.task();
      } catch (error) {
        this.bus.publish({
          type: SognaEventType.ERROR,
          emitter: `BackgroundTask:${service.name}`,
          provenance: EventProvenance.HEALTH,
          failureClass: FailureClass.INFRA,
          data: { message: error instanceof Error ? error.message : String(error) }
        });
        Hub.getInstance().reportIntel('WARNING', `Fallo en servicio: ${service.name}`, 'Orchestrator');
      }
    }, service.intervalMs);

    this.services.set(service.name, timer);
    console.log(Color.cyan(`[swarm] Service ${service.name} started.`));
  }

  public stopService(name: string): void {
    const timer = this.services.get(name);
    if (timer) { clearInterval(timer); this.services.delete(name); }
  }

  public stopAll(): void {
    for (const name of this.services.keys()) this.stopService(name);
  }
}
