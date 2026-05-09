import { Provider } from './Provider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { ClaudeProvider } from '../providers/ClaudeProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { MoonshotProvider } from '../providers/MoonshotProvider.js';
import { DeepSeekProvider } from '../providers/DeepSeekProvider.js';
import { OpenRouterProvider } from '../providers/OpenRouterProvider.js';
import { AiderProvider } from '../providers/AiderProvider.js';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { HybridProvider } from '../providers/HybridProvider.js';
import { ModelRouter, SognaTaskType } from './ModelRouter.js';

export class ProviderFactory {
  static getProvider(name?: string, model?: string): Provider {
    // Local Mode: Prioritize local models if envar is set
    const localMode = process.env.SOGNA_LOCAL_MODE === 'true';
    let providerName = name || process.env.SOGNATORE_PROVIDER || (localMode ? 'ollama' : 'gemini');

    // Model-based Prefix Routing (Claw-inspired)
    if (model && model.includes('/')) {
      const prefix = model.split('/')[0].toLowerCase();
      const validPrefixes = ['gemini', 'claude', 'openai', 'kimi', 'moonshot', 'deepseek', 'openrouter', 'aider', 'ollama'];
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
      case 'ollama':
        return new OllamaProvider();
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * Retorna el mejor proveedor para un sueño específico.
   * Si el modo local está activo, siempre devolverá Ollama configurado con el modelo especialista.
   */
  static getProviderForTask(objective: string): Provider {
    const taskType = ModelRouter.detectTaskType(objective);
    const localMode = process.env.SOGNA_LOCAL_MODE === 'true';
    const hybridMode = process.env.SOGNA_HYBRID_MODE === 'true';

    if (localMode) {
      return new OllamaProvider();
    }

    if (hybridMode) {
      // Create local + cloud pair
      const local = new OllamaProvider();
      const cloud = this.getProvider(); // Default cloud provider
      return new HybridProvider(local, cloud);
    }

    return this.getProvider();
  }

  static async getAvailableProviders(): Promise<Provider[]> {
    const allProviders = [
      new GeminiProvider(),
      new ClaudeProvider(),
      new OpenAIProvider(),
      new MoonshotProvider(),
      new DeepSeekProvider(),
      new OpenRouterProvider(),
      new AiderProvider(),
      new OllamaProvider()
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
