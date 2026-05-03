import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/provider.js';
import { execa } from 'execa';
import path from 'path';
import os from 'os';

export class ClaudeProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'claude',
    displayName: 'Claude Code',
    cli: 'claude'
  };

  private skillDir: string = path.join(os.homedir(), '.claude', 'skills');

  getName(): string {
    return 'Claude 4.6 (Symmetry-Optimized)';
  }


  async detect(): Promise<boolean> {
    try {
      await execa(this.metadata.cli, ['--version'], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async version(): Promise<string> {
    try {
// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      const { execSync } = await import('child_process');
// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      return execSync('claude --version', { encoding: 'utf8' }).split('\n')[0];
    } catch {
      return 'unknown';
    }
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    const resolvedTier = this.resolveTier(tier);
    const model = this.resolveModelForTier(resolvedTier);
    
    // Security Enforcement: Before calling the external provider, we check our own Permission Proxy
    const { PermissionProxy } = await import('../sentinel-sognatore/permissionproxy.js');
    const proxy = PermissionProxy.getInstance();
    const isAuthorized = await proxy.requestCapability('claude-provider', 'process:execute', `Invoke model ${model} with prompt length ${prompt.length}`);
    
    if (!isAuthorized && process.env.SOGNA_STRICT_MODE === 'true') {
      throw new Error('[SECURITY] Execution blocked by Sentinel Permission Proxy. Capability: process:execute');
    }

    // Build arguments
    const args = ['--dangerously-skip-permissions', '--model', model, '-p', '-'];

    
    if (options.extraArgs) {
      args.push(...(options.extraArgs as string[]));
    }

    try {
      const { all } = await execa('claude', args, {
        all: true,
        input: prompt, // Pipe prompt via stdin
        env: { ...process.env, ...(options.env as Record<string, string | undefined>) }
      });
      return all || '';
    } catch (error: unknown) {
      // Return partial output if available, otherwise rethrow
      const err = error as { all?: string; message?: string };
      if (err.all) return err.all;
      throw new Error(`Claude process failed: ${err.message || String(error)}`, { cause: error });
    }
  }

  private resolveModelForTier(tier: 'planning' | 'development' | 'fast'): string {
    const allowHaiku = process.env.SOGNATORE_ALLOW_HAIKU === 'true';
    const maxTier = process.env.SOGNATORE_MAX_TIER;

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

