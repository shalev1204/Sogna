import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';
import { spawn } from 'child_process';

export class OpenAIProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'openai',
    displayName: 'OpenAI GPT',
    cli: 'openai'
  };

  getName(): string {
    return 'GPT-5.4 (Product-Optimized)';
  }

  async detect(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('openai --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      return execSync(`${this.metadata.cli} --version`, { encoding: 'utf8' }).split('\n')[0];
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = this.resolveModelForTier(tier);
    
    // As of 2026, the standard OpenAI CLI uses a direct completion/chat command
    const args = ['chat', 'create', '--model', model, '--message', prompt];
    
    if (options.json) {
      args.push('--format', 'json');
    }

    return new Promise((resolve, reject) => {
      let output = '';
      const proc = spawn(this.metadata.cli, args, {
        shell: true,
        env: { ...process.env, ...(options.env as Record<string, string>) }
      });

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          // Some versions output result to stdout even on non-zero exit (warning/info)
          if (output) resolve(output.trim());
          else reject(new Error(`OpenAI process exited with code ${code}`));
        }
      });
    });
  }

  private resolveModelForTier(tier: CapabilityTier): string {
    switch (tier) {
      case 'planning':
      case 'best':
        return 'gpt-5.4';
      case 'development':
      case 'balanced':
        return 'gpt-5.1';
      case 'fast':
      case 'cheap':
        return 'gpt-4o-mini';
      default:
        return 'gpt-5.4';
    }
  }
}
