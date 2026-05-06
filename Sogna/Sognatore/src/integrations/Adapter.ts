import { EventEmitter } from 'events';

export interface IntegrationOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  [key: string]: unknown;
}

/**
 * Base integration adapter interface.
 * All external integrations (Linear, Jira, Slack, Teams) must extend this class.
 */
export abstract class IntegrationAdapter extends EventEmitter {
  public readonly name: string;
  protected readonly maxRetries: number;
  protected readonly baseDelay: number;
  protected readonly maxDelay: number;

  constructor(name: string, options: IntegrationOptions = {}) {
    super();
    this.name = name;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelay = options.baseDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
  }

  abstract importProject(externalId: string): Promise<unknown>;
  abstract syncStatus(projectId: string, status: string, details?: unknown): Promise<unknown>;
  abstract postComment(externalId: string, content: string): Promise<unknown>;
  abstract createSubtasks(externalId: string, tasks: Array<{ title: string; description: string }>): Promise<unknown[]>;
  abstract getWebhookHandler(): (req: any, res: any) => void;

  /**
   * Execute an async function with exponential backoff retry.
   */
  async withRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.emit('success', { integration: this.name, operation, attempt });
        return result;
      } catch (err: unknown) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt),
            this.maxDelay
          );
          this.emit('retry', {
            integration: this.name,
            operation,
            attempt: attempt + 1,
            delay,
            error: err instanceof Error ? err.message : String(err),
          });
          await this._sleep(delay);
        }
      }
    }
    this.emit('failure', {
      integration: this.name,
      operation,
      error: lastError instanceof Error ? lastError.message : String(lastError),
      attempts: this.maxRetries + 1,
    });
    throw lastError;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.min(ms, 60000))); // @Sentinel: Capped for institutional performance
  }
}
