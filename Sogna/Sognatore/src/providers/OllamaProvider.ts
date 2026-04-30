import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';
import { execa } from 'execa';

export class OllamaProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'ollama',
    displayName: 'Ollama (Local Sovereignty)',
    cli: 'ollama'
  };

  getName(): string {
    return 'Ollama Local Engine';
  }

  async detect(): Promise<boolean> {
    try {
      await execa(this.metadata.cli, ['--version'], { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
      const { stdout } = await execa('ollama', ['--version']);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = options.model || process.env.OLLAMA_MODEL || 'llama3';
    
    try {
      const { stdout } = await execa('ollama', ['run', model, prompt], {
        env: { ...process.env, ...(options.env as Record<string, string | undefined>) }
      });
      return stdout || '';
    } catch (error: any) {
      throw new Error(`Ollama invocation failed: ${error.message}`);
    }
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    // Map tiers to local models if available
    let model = 'llama3';
    if (tier === 'planning') model = 'command-r';
    if (tier === 'fast') model = 'phi3';

    return this.invoke(prompt, { ...options, model });
  }
}
