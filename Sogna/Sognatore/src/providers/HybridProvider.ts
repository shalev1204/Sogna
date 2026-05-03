import { Provider, InvokeOptions, CapabilityTier, ProviderMetadata } from '../core/Provider.js';
import { SognaEventBus, SognaEventType, EventProvenance, FailureClass } from '@sogna/curator';
import chalk from 'chalk';

/**
 * Hybrid Provider - The Fail-over Circuit
 * Implements 30s timeout fallback from Local to Cloud.
 */
export class HybridProvider extends Provider {
  private bus = SognaEventBus.getInstance();

  readonly metadata: ProviderMetadata = {
    name: 'hybrid',
    displayName: 'Hybrid (Local Swarm + Cloud)',
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

  async invoke(prompt: string, options?: InvokeOptions): Promise<string> {
    return this.executeWithFailover(async (p) => p.invoke(prompt, options));
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options?: InvokeOptions): Promise<string> {
    return this.executeWithFailover(async (p) => p.invokeWithTier(tier, prompt, options));
  }

  private async executeWithFailover(task: (p: Provider) => Promise<string>): Promise<string> {
    const timeoutMs = 30000; // 30s Circuit Breaker
    
    this.bus.publish({
      type: SognaEventType.LOG,
      emitter: 'HybridProvider',
      provenance: EventProvenance.LIVE,
      failureClass: FailureClass.NONE,
      data: { message: `Attempting execution on Local Swarm... (Fail-over: ${timeoutMs}ms)` }
    });

    try {
      // Promise.race to implement the 30s timeout
      const result = await Promise.race([
        task(this.local),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Local Swarm exceeded 30s limit.')), timeoutMs)
        )
      ]);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(chalk.yellow(`[HybridProvider] Local Swarm fail-over triggered: ${errorMessage}`));
      
      this.bus.publish({
        type: SognaEventType.ERROR,
        emitter: 'HybridProvider',
        provenance: EventProvenance.LIVE,
        failureClass: FailureClass.INFRA,
        data: { message: `Local Swarm latency too high or error: ${errorMessage}. Switching to Cloud.` }
      });

      // Emergency Cloud Execution
      return await task(this.cloud);
    }
  }
}
