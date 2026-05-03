import { BUILTIN_AGENT_NAMES } from './validator.js';
import { AgentPluginConfig } from './plugintypes.js';

// In-memory registry for custom agent plugins
const _registeredAgents = new Map<string, any>();

export class AgentPluginHandler {
  /**
   * Register a custom agent plugin.
   * Cannot override built-in agent types (additive only).
   *
   * @param pluginConfig - Validated agent plugin config
   * @param registry - Optional external registry to also register into
   * @returns Success status and optional error message
   */
  public static register(pluginConfig: AgentPluginConfig, registry?: any): { success: boolean; error?: string } {
    if (!pluginConfig || pluginConfig.type !== 'agent') {
      return { success: false, error: 'Invalid plugin config: type must be "agent"' };
    }

    const name = pluginConfig.name;

    // Prevent overriding built-in agents
    if (BUILTIN_AGENT_NAMES.includes(name)) {
      return {
        success: false,
        error: `Cannot override built-in agent type: "${name}"`,
      };
    }

    // Check for duplicate custom registration
    if (_registeredAgents.has(name)) {
      return {
        success: false,
        error: `Agent plugin "${name}" is already registered`,
      };
    }

    // Build agent definition compatible with swarm registry format
    const agentDef = {
      name: name,
      type: 'custom',
      category: (pluginConfig as any).category || 'custom',
      description: pluginConfig.description,
      system_prompt: pluginConfig.system_prompt,
      model: pluginConfig.model,
      tools: pluginConfig.tools || [],
      knowledge: pluginConfig.knowledge || {},
      registered_at: new Date().toISOString(),
    };

    _registeredAgents.set(name, agentDef);

    // If an external registry object is provided, add to its custom category
    if (registry && typeof registry === 'object') {
      if (registry.customAgents) {
        registry.customAgents[name] = agentDef;
      }
    }

    return { success: true };
  }

  /**
   * Unregister a custom agent plugin.
   *
   * @param pluginName - Name of the agent plugin to remove
   * @param registry - Optional external registry to also remove from
   * @returns Success status and optional error message
   */
  public static unregister(pluginName: string, registry?: any): { success: boolean; error?: string } {
    if (!_registeredAgents.has(pluginName)) {
      return { success: false, error: `Agent plugin "${pluginName}" is not registered` };
    }

    _registeredAgents.delete(pluginName);

    if (registry && registry.customAgents) {
      delete registry.customAgents[pluginName];
    }

    return { success: true };
  }

  /**
   * List all registered custom agent plugins.
   *
   * @returns Array of agent definitions
   */
  public static listRegistered(): any[] {
    return Array.from(_registeredAgents.values());
  }

  /**
   * Get a specific registered agent plugin by name.
   *
   * @param name - Agent plugin name
   * @returns Agent definition or null
   */
  public static get(name: string): any | null {
    return _registeredAgents.get(name) || null;
  }

  /**
   * Check if a custom agent is registered.
   *
   * @param name - Agent name
   * @returns True if registered
   */
  public static isRegistered(name: string): boolean {
    return _registeredAgents.has(name);
  }

  /**
   * Clear all registered custom agents (primarily for testing).
   */
  public static _clearAll(): void {
    _registeredAgents.clear();
  }
}
