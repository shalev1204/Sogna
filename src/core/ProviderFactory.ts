import { Provider } from './Provider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { ClaudeProvider } from '../providers/ClaudeProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { AiderProvider } from '../providers/AiderProvider.js';

export class ProviderFactory {
  static getProvider(name?: string): Provider {
    const providerName = name || process.env.LOKI_PROVIDER || 'gemini';

    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'claude':
        return new ClaudeProvider();
      case 'openai':
        return new OpenAIProvider();
      case 'aider':
        return new AiderProvider();
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  static async getAvailableProviders(): Promise<Provider[]> {
    const allProviders = [
      new GeminiProvider(),
      new ClaudeProvider(),
      new OpenAIProvider(),
      new AiderProvider()
    ];

    const availability = await Promise.all(
      allProviders.map(async (p) => {
        const isPresent = await p.detect();
        return isPresent ? p : null;
      })
    );

    return availability.filter((p): p is Provider => p !== null);
  }
}
