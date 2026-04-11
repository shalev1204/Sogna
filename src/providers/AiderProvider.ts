import { Provider, CapabilityTier, ProviderMetadata } from '../core/Provider.js';
import { spawn, execSync } from 'child_process';

export class AiderProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'aider',
    displayName: 'Aider (18+ Providers)',
    cli: 'aider'
  };

  getName(): string {
    return 'Aider (18+ Model Consensus)';
  }

  async detect(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('aider --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      return execSync('aider --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: any = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: any = {}): Promise<string> {
    const model = process.env.LOKI_AIDER_MODEL || 
                  process.env.LOKI_MODEL_DEVELOPMENT || 
                  'claude-3-5-sonnet-20240620';

    const args = [
      '--message', prompt,
      '--yes-always',
      '--no-auto-commits',
      '--model', model
    ];

    if (options.noGit) args.push('--no-git');
    if (options.extraArgs) args.push(...options.extraArgs);

    return new Promise((resolve, reject) => {
      let output = '';
      const proc = spawn('aider', args, {
        shell: true,
        env: { ...process.env, ...options.env }
      });

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        if (options.onToken) options.onToken(chunk);
      });

      proc.stderr.on('data', (data) => {
        // Aider UI output
      });

      proc.on('close', (code) => {
        // Aider might exit with 1 on success due to git warnings, we check output
        if (output || code === 0) resolve(output);
        else reject(new Error(`Aider process exited with code ${code}`));
      });
    });
  }
}
