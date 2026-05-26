import { Color, EventProvenance, FailureClass, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { Provider, InvokeOptions, CapabilityTier, ProviderMetadata } from '../core/Provider.js';
import { OllamaProvider } from './OllamaProvider.js';

/**
 * Hybrid Provider - The Fail-over Circuit
 * Implements 30s timeout fallback from Local to Cloud.
 */
export class HybridProvider extends Provider {
  private bus = SognaEventBus.getInstance();

  readonly metadata: ProviderMetadata = {
    name: 'hybrid',
    displayName: 'Hybrid (Local swarm + Cloud)',
    cli: 'ollama'
  };

  constructor(
    private local: Provider,
    private cloud: Provider
  ) {
    super();
  }

  getName(): string { return `Hybrid(${this.local.getName()}/${this.cloud.getName()})`; }
  
  async detect(): Promise<boolean> {
    return (await this.local.detect()) || (await this.cloud.detect());
  }

  async version(): Promise<string> {
    return `Hybrid (L:${await this.local.version()} / C:${await this.cloud.version()})`;
  }

  private async _checkLocalAvailability(options?: InvokeOptions, tier?: CapabilityTier): Promise<boolean> {
    if (this.local instanceof OllamaProvider) {
      let model = options?.model;
      if (!model && tier) {
        model = process.env.SOGNA_MODEL_GUARD || 'llama3.1:latest';
        if (tier === 'best' || tier === 'planning') {
          model = process.env.SOGNA_MODEL_ARCHITECT || 'deepseek-coder-v2:lite';
        } else if (tier === 'fast') {
          model = process.env.SOGNA_MODEL_PREDATORE || 'qwen2.5-coder:7b';
        }
      } else if (!model) {
        model = process.env.OLLAMA_MODEL || 'llama3';
      }
      
      const available = await this.local.isModelAvailable(model);
      if (!available) {
        this.bus.publish({
          type: SognaEventType.LOG,
          emitter: 'HybridProvider',
          provenance: EventProvenance.LIVE,
          failureClass: FailureClass.NONE,
          data: { message: `Local model '${model}' not downloaded. Performing pre-emptive cloud failover.` }
        });
        return false;
      }
    }
    return true;
  }

  async invoke(prompt: string, options?: InvokeOptions): Promise<string> {
    const localReady = await this._checkLocalAvailability(options);
    if (!localReady) {
      return this.cloud.invoke(prompt, options);
    }
    return this.executeWithFailover(async (p) => p.invoke(prompt, options));
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options?: InvokeOptions): Promise<string> {
    const localReady = await this._checkLocalAvailability(options, tier);
    if (!localReady) {
      return this.cloud.invokeWithTier(tier, prompt, options);
    }
    return this.executeWithFailover(async (p) => p.invokeWithTier(tier, prompt, options));
  }

  private async executeWithFailover(task: (p: Provider) => Promise<string>): Promise<string> {
    const timeoutMs = 30000; // 30s Circuit Breaker
    
    this.bus.publish({
      type: SognaEventType.LOG,
      emitter: 'HybridProvider',
      provenance: EventProvenance.LIVE,
      failureClass: FailureClass.NONE,
      data: { message: `Attempting execution on Local swarm... (Fail-over: ${timeoutMs}ms)` }
    });

    try {
      // Promise.race to implement the 30s timeout
      const result = await Promise.race([
        task(this.local),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Local swarm exceeded 30s limit.')), timeoutMs)
        )
      ]);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(Color.yellow(`[HybridProvider] Local swarm fail-over triggered: ${errorMessage}`));
      
      this.bus.publish({
        type: SognaEventType.ERROR,
        emitter: 'HybridProvider',
        provenance: EventProvenance.LIVE,
        failureClass: FailureClass.INFRA,
        data: { message: `Local swarm latency too high or error: ${errorMessage}. Switching to Cloud.` }
      });

      // Emergency Cloud Execution
      return await task(this.cloud);
    }
  }
}
