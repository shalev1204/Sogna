import { Provider, CapabilityTier, ProviderMetadata } from '../core/Provider.js';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

export class ClaudeProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'claude',
    displayName: 'Claude Code',
    cli: 'claude'
  };

  private skillDir: string = path.join(os.homedir(), '.claude', 'skills');

  async detect(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('claude --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      return execSync('claude --version', { encoding: 'utf8' }).split('\n')[0];
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: any = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: any = {}): Promise<string> {
    const resolvedTier = this.resolveTier(tier);
    const model = this.resolveModelForTier(resolvedTier);
    
    // Build arguments
    const args = ['--dangerously-skip-permissions', '--model', model, '-p', prompt];
    
    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    return new Promise((resolve, reject) => {
      let output = '';
      const proc = spawn('claude', args, {
        shell: true,
        env: { ...process.env, ...options.env }
      });

      proc.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        if (options.onToken) {
          options.onToken(chunk);
        }
      });

      proc.stderr.on('data', (data) => {
        // Claude Code UI output
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          // If output was captured, it might be partially successful but exit code 1 due to CLI UI
          if (output) resolve(output);
          else reject(new Error(`Claude process exited with code ${code}`));
        }
      });
    });
  }

  private resolveModelForTier(tier: 'planning' | 'development' | 'fast'): string {
    const allowHaiku = process.env.LOKI_ALLOW_HAIKU === 'true';
    const maxTier = process.env.LOKI_MAX_TIER;

    let model = 'sonnet';

    switch (tier) {
      case 'planning':
        model = 'opus';
        break;
      case 'development':
        model = allowHaiku ? 'sonnet' : 'opus';
        break;
      case 'fast':
        model = allowHaiku ? 'haiku' : 'sonnet';
        break;
    }

    if (maxTier === 'haiku') return 'haiku';
    if (maxTier === 'sonnet' && model === 'opus') return 'sonnet';

    return model;
  }
}
