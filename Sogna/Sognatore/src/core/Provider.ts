export type CapabilityTier = 'planning' | 'development' | 'fast' | 'best' | 'balanced' | 'cheap';

export interface ProviderMetadata {
  name: string;
  displayName: string;
  cli: string;
}

export interface InvokeOptions {
  model?: string;
  tier?: CapabilityTier;
  env?: Record<string, string>;
  json?: boolean;
  extraArgs?: string[];
  onToken?: (token: string) => void;
  [key: string]: unknown;
}

export abstract class Provider {
  abstract readonly metadata: ProviderMetadata;

  abstract getName(): string;
  abstract detect(): Promise<boolean>;
  abstract version(): Promise<string>;
  
  abstract invoke(prompt: string, options?: InvokeOptions): Promise<string>;
  abstract invokeWithTier(tier: CapabilityTier, prompt: string, options?: InvokeOptions): Promise<string>;

  protected resolveTier(tier: CapabilityTier): 'planning' | 'development' | 'fast' {
    switch (tier) {
      case 'best': return 'planning';
      case 'balanced': return 'development';
      case 'cheap': return 'fast';
      default: return tier as 'planning' | 'development' | 'fast';
    }
  }
}
