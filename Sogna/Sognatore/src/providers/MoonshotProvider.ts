import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';

export class MoonshotProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'kimi',
    displayName: 'Moonshot AI (Kimi)',
    cli: 'none (direct api)'
  };

  private readonly baseUrl = 'https://api.moonshot.cn/v1';

  getName(): string {
    return 'Kimi K2.5 (Visionary Context)';
  }

  async detect(): Promise<boolean> {
    return !!process.env.KIMI_API_KEY;
  }

  async version(): Promise<string> {
    return 'v1.0.0 (API v1)';
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = options.model || this.resolveModelForTier(tier);
    const apiKey = process.env.KIMI_API_KEY;

    if (!apiKey) {
      throw new Error('KIMI_API_KEY is not defined in the environment.');
    }

    const messages = [
      { role: 'system', content: 'Eres Sognatore, un enjambre de agentes autónomos de alta precisión.' },
      { role: 'user', content: prompt }
    ];

    const body: Record<string, any> = {
      model: model,
      messages: messages,
      temperature: options.temperature ?? 0.3,
    };

    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Moonshot AI API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private resolveModelForTier(tier: CapabilityTier): string {
    const resolvedTier = this.resolveTier(tier);
    switch (resolvedTier) {
      case 'planning':
        return 'kimi-k2.5';
      case 'development':
        return 'kimi-k2-turbo';
      case 'fast':
        return 'moonshot-v1-8k';
      default:
        return 'kimi-k2.5';
    }
  }
}

