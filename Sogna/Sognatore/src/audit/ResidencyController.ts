import fs from 'fs';
import path from 'path';
import { ResidencyConfig } from './audittypes.js';

const DEFAULT_ALLOWED_PROVIDERS: string[] = [];

export const PROVIDER_REGIONS: Record<string, string[]> = {
  'anthropic': ['us', 'eu'],
  'openai': ['us', 'eu', 'asia'],
  'google': ['us', 'eu', 'asia'],
  'ollama': ['local'],
};

export class ResidencyController {
  private readonly _configPath: string;
  private _config: ResidencyConfig;

  constructor(opts?: { projectDir?: string; config?: ResidencyConfig }) {
    const projectDir = opts?.projectDir || process.cwd();
    this._configPath = path.join(projectDir, '.sognatore', 'residency.json');
    this._config = opts?.config || this._loadConfig();
  }

  public checkProvider(provider: string, region?: string): { allowed: boolean; reason: string | null } {
    if (!provider) {
      return { allowed: false, reason: 'Provider name is required' };
    }

    const p = provider.toLowerCase();

    // Air-gapped mode: only local providers
    if (this._config.air_gapped) {
      const isLocal = p === 'ollama' || p === 'local';
      return isLocal
        ? { allowed: true, reason: null }
        : { allowed: false, reason: 'Air-gapped mode: only local providers (ollama) allowed' };
    }

    // Check allowed providers list
    const allowedProviders = this._config.allowed_providers || [];
    if (allowedProviders.length > 0 && !allowedProviders.includes(p)) {
      return { 
        allowed: false, 
        reason: `Provider "${p}" not in allowed list: ${allowedProviders.join(', ')}` 
      };
    }

    // Check region restrictions
    const allowedRegions = this._config.allowed_regions || [];
    if (allowedRegions.length > 0 && region) {
      const r = region.toLowerCase();
      if (!allowedRegions.includes(r)) {
        return { 
          allowed: false, 
          reason: `Region "${r}" not in allowed list: ${allowedRegions.join(', ')}` 
        };
      }
    }

    return { allowed: true, reason: null };
  }

  public getConfig(): ResidencyConfig {
    return { ...this._config };
  }

  public isAirGapped(): boolean {
    return this._config.air_gapped === true;
  }

  public getAllowedProviders(): string[] {
    return [...(this._config.allowed_providers || [])];
  }

  public getAllowedRegions(): string[] {
    return [...(this._config.allowed_regions || [])];
  }

  public reload(): void {
    this._config = this._loadConfig();
  }

  private _loadConfig(): ResidencyConfig {
    try {
      if (fs.existsSync(this._configPath)) {
        const raw = fs.readFileSync(this._configPath, 'utf8');
        const config = JSON.parse(raw);
        return {
          allowed_providers: Array.isArray(config.allowed_providers) 
            ? config.allowed_providers.map((p: any) => String(p).toLowerCase()) 
            : [],
          allowed_regions: Array.isArray(config.allowed_regions) ? config.allowed_regions : [],
          air_gapped: config.air_gapped === true,
        };
      }
    } catch (_) {
      // Fall through to defaults
    }

    return {
      allowed_providers: DEFAULT_ALLOWED_PROVIDERS,
      allowed_regions: [],
      air_gapped: false,
    };
  }
}
