import { Provider } from './Provider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { ClaudeProvider } from '../providers/ClaudeProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { MoonshotProvider } from '../providers/MoonshotProvider.js';
import { DeepSeekProvider } from '../providers/DeepSeekProvider.js';
import { OpenRouterProvider } from '../providers/OpenRouterProvider.js';
import { AiderProvider } from '../providers/AiderProvider.js';

export class ProviderFactory {
  static getProvider(name?: string, model?: string): Provider {
    let providerName = name || process.env.SOGNATORE_PROVIDER || 'gemini';

    // Model-based Prefix Routing (Claw-inspired)
    if (model && model.includes('/')) {
      const prefix = model.split('/')[0].toLowerCase();
      const validPrefixes = ['gemini', 'claude', 'openai', 'kimi', 'moonshot', 'deepseek', 'openrouter', 'aider'];
      if (validPrefixes.includes(prefix)) {
        providerName = prefix;
      }
    }

    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'claude':
        return new ClaudeProvider();
      case 'openai':
        return new OpenAIProvider();
      case 'kimi':
      case 'moonshot':
        return new MoonshotProvider();
      case 'deepseek':
        return new DeepSeekProvider();
      case 'openrouter':
        return new OpenRouterProvider();
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
      new MoonshotProvider(),
      new DeepSeekProvider(),
      new OpenRouterProvider(),
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
