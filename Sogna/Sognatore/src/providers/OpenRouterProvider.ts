import { Provider, CapabilityTier, ProviderMetadata, type InvokeOptions } from '../core/Provider.js';

export class OpenRouterProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'openrouter',
    displayName: 'OpenRouter (Omni)',
    cli: 'none (direct api)'
  };

  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  getName(): string {
    return 'OpenRouter Global Gateway';
  }

  async detect(): Promise<boolean> {
    return !!process.env.OPENROUTER_API_KEY;
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
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not defined in the environment.');
    }

    const messages = [
      { role: 'system', content: 'Eres Sognatore, un orquestador de agentes de inteligencia artificial.' },
      { role: 'user', content: prompt }
    ];

    const body: Record<string, any> = {
      model: model,
      messages: messages,
      temperature: options.temperature ?? 0.3
    };

    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/shalev1204/sognatore', // Sognatore source
        'X-Title': 'Sognatore Ecosystem'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private resolveModelForTier(tier: CapabilityTier): string {
    const resolvedTier = this.resolveTier(tier);
    switch (resolvedTier) {
      case 'planning':
        return 'anthropic/claude-3.5-sonnet';
      case 'development':
        return 'meta-llama/llama-3.1-405b';
      case 'fast':
        return 'google/gemini-flash-1.5';
      default:
        return 'meta-llama/llama-3.1-405b';
    }
  }
}

