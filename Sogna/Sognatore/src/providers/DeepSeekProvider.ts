import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';

export class DeepSeekProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'deepseek',
    displayName: 'DeepSeek AI',
    cli: 'none (direct api)'
  };

  private readonly baseUrl = 'https://api.deepseek.com';

  getName(): string {
    return 'DeepSeek V3/R1 (Efficiency Leader)';
  }

  async detect(): Promise<boolean> {
    return !!process.env.DEEPSEEK_API_KEY;
  }

  async version(): Promise<string> {
    return 'v3.0.0 (API v1)';
  }

  async invoke(prompt: string, options: InvokeOptions = {}): Promise<string> {
    const tier = options.tier || 'development';
    return this.invokeWithTier(tier as CapabilityTier, prompt, options);
  }

  async invokeWithTier(tier: CapabilityTier, prompt: string, options: InvokeOptions = {}): Promise<string> {
    const model = options.model || this.resolveModelForTier(tier);
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not defined in the environment.');
    }

    const messages = [
      { role: 'system', content: 'Eres Sognatore, un experto en desarrollo de software y arquitectura.' },
      { role: 'user', content: prompt }
    ];

    const body: Record<string, any> = {
      model: model,
      messages: messages,
      temperature: options.temperature ?? 0.3,
      stream: false
    };

    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
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
      throw new Error(`DeepSeek API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private resolveModelForTier(tier: CapabilityTier): string {
    const resolvedTier = this.resolveTier(tier);
    switch (resolvedTier) {
      case 'planning':
        return 'deepseek-reasoner';
      case 'development':
      case 'fast':
        return 'deepseek-chat';
      default:
        return 'deepseek-chat';
    }
  }
}

