import { execa } from 'execa';
import { Provider, type ProviderMetadata, type CapabilityTier, type InvokeOptions } from '../core/provider.js';

export class GeminiProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'gemini',
    displayName: 'Google Gemini CLI',
    cli: 'gemini'
  };

  getName(): string {
    return 'Google Gemini 3.1 Pro (Ops-Optimized)';
  }

  private readonly defaultModels = {
    planning: 'gemini-3-pro-preview',
    development: 'gemini-3-pro-preview',
    fast: 'gemini-3-flash-preview'
  };

  async detect(): Promise<boolean> {
    try {
      await execa(this.metadata.cli, ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    const { stdout } = await execa(this.metadata.cli, ['--version']);
    return stdout.split('\n')[0].trim();
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = (options.model as string) || this.defaultModels.planning;
    return this.execute(prompt, model, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    const resolvedTier = this.resolveTier(tier);
    const model = this.defaultModels[resolvedTier];
    return this.execute(prompt, model, options);
  }

  private async execute(prompt: string, model: string, options: InvokeOptions): Promise<string> {
    const args = [
      '--approval-mode=yolo',
      '--model', model,
      '-' // Convention for reading from stdin
    ];

    try {
      const { all } = await execa(this.metadata.cli, args, { 
        all: true,
        input: prompt, // Pipe the prompt via stdin
        env: { ...process.env, ...(options.env as Record<string, string | undefined>) }
      });
      return all || '';
    } catch (error: unknown) {
      const err = error as { message?: string };
      const message = err.message || String(error);
      if (message.includes('429') || message.includes('Quota')) {
        // Fallback to flash if pro fails
        if (model !== this.defaultModels.fast) {
          console.warn(`[Gemini] Rate limit hit on ${model}, falling back to ${this.defaultModels.fast}`);
          return this.execute(prompt, this.defaultModels.fast, options);
        }
      }
      throw error;
    }
  }
}
