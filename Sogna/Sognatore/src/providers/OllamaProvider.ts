import { Exec } from '@Sogna/Curator';
import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';


export class OllamaProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'ollama',
    displayName: 'Ollama (Local Control)',
    cli: 'ollama'
  };

  getName(): string {
    return 'Ollama Local Engine';
  }

  async detect(): Promise<boolean> {
    try {
      await Exec.run(this.metadata.cli, ['--version'], { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
      const { stdout } = await Exec.run('ollama', ['--version']);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = options.model || process.env.OLLAMA_MODEL || 'llama3';
    
    try {
      const { stdout } = await Exec.run('ollama', ['run', model, prompt], {
        env: { ...process.env, ...(options.env as Record<string, string | undefined>) }
      });
      return stdout || '';
    } catch (error: any) {
      throw new Error(`Ollama invocation failed: ${error.message}`, { cause: error });
    }
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    // swarm status Mapping
    let model = process.env.SOGNA_MODEL_GUARD || 'llama3.1:latest';
    
    if (tier === 'best' || tier === 'planning') {
      model = process.env.SOGNA_MODEL_ARCHITECT || 'deepseek-coder-v2:lite';
    } else if (tier === 'fast') {
      model = process.env.SOGNA_MODEL_PREDATORE || 'qwen2.5-coder:7b';
    }

    // Fallback automático: si el modelo primario no está instalado, usar gemma4:31b
    if (!(await this.isModelAvailable(model))) {
      const fallback = process.env.SOGNA_MODEL_FALLBACK || 'gemma4:31b';
      if (fallback !== model && await this.isModelAvailable(fallback)) {
        model = fallback;
      }
    }

    return this.invoke(prompt, { ...options, model });
  }

  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const { stdout } = await Exec.run('ollama', ['list'], { timeout: 3000 });
      return stdout.includes(modelName);
    } catch {
      return false;
    }
  }
}
