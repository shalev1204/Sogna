import { Provider, type CapabilityTier, type InvokeOptions, type ProviderMetadata } from '../core/Provider.js';
import {
  assertBudgetAllowsUsage,
  estimateTokens,
  recordTokenUsage,
} from '../core/utils/TokenRecording.js';
import { ensureObservability } from '../observability/bootstrap.js';
import { startLlmInvokeSpan } from '../observability/spans.js';
import * as otel from '../observability/otel.js';

const RETRYABLE = /429|quota|rate.?limit|timeout|503|502|500|ECONNRESET|ETIMEDOUT/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decorador transversal: retry con backoff exponencial ante fallos transitorios de API.
 */
export class ResilientProvider extends Provider {
  readonly metadata: ProviderMetadata;

  constructor(
    private readonly inner: Provider,
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 1000,
  ) {
    super();
    this.metadata = {
      ...inner.metadata,
      displayName: `Resilient ${inner.metadata.displayName}`,
    };
  }

  getName(): string {
    return this.inner.getName();
  }

  async detect(): Promise<boolean> {
    return this.inner.detect();
  }

  async version(): Promise<string> {
    return this.inner.version();
  }

  private async invokeWithRetry(task: () => Promise<string>): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const retryable = RETRYABLE.test(message);
        if (!retryable || attempt >= this.maxRetries - 1) break;
        const delay = this.baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
    throw lastError;
  }

  private recordGovernance(prompt: string, result: string, options: InvokeOptions | undefined, startedAt: number): void {
    if (options?.skipGovernance) return;
    recordTokenUsage({
      agentId: options?.agentId ?? this.inner.getName(),
      model: options?.model ?? 'unknown',
      inputTokens: estimateTokens(prompt.length),
      outputTokens: estimateTokens(result.length),
      swarm: options?.swarm,
      durationMs: Date.now() - startedAt,
    });
  }

  async invoke(prompt: string, options?: InvokeOptions): Promise<string> {
    if (!options?.skipGovernance) assertBudgetAllowsUsage();
    ensureObservability();
    const agentId = options?.agentId ?? this.inner.getName();
    const model = options?.model ?? 'unknown';
    const span = startLlmInvokeSpan(agentId, model, options?.swarm);
    const startedAt = Date.now();
    try {
      const result = await this.invokeWithRetry(() => this.inner.invoke(prompt, options));
      this.recordGovernance(prompt, result, options, startedAt);
      span.setAttribute('llm.input_chars', prompt.length);
      span.setAttribute('llm.output_chars', result.length);
      span.setStatus(otel.SpanStatusCode.OK);
      return result;
    } catch (error) {
      span.setStatus(
        otel.SpanStatusCode.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    } finally {
      span.end();
    }
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options?: InvokeOptions): Promise<string> {
    if (!options?.skipGovernance) assertBudgetAllowsUsage();
    ensureObservability();
    const agentId = options?.agentId ?? this.inner.getName();
    const model = options?.model ?? tier;
    const span = startLlmInvokeSpan(agentId, model, options?.swarm);
    const startedAt = Date.now();
    try {
      const result = await this.invokeWithRetry(() => this.inner.invokeWithTier(tier, prompt, options));
      this.recordGovernance(prompt, result, options, startedAt);
      span.setAttribute('llm.input_chars', prompt.length);
      span.setAttribute('llm.output_chars', result.length);
      span.setAttribute('llm.tier', tier);
      span.setStatus(otel.SpanStatusCode.OK);
      return result;
    } catch (error) {
      span.setStatus(
        otel.SpanStatusCode.ERROR,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    } finally {
      span.end();
    }
  }
}

export function wrapWithResilience(provider: Provider): Provider {
  if (provider instanceof ResilientProvider) return provider;
  return new ResilientProvider(provider);
}
