import { PluginValidator, BUILTIN_AGENT_NAMES, VALID_PLUGIN_TYPES } from './validator.js';
import { PluginLoader, parseSimpleYAML } from './loader.js';
import { AgentPluginHandler } from './agentpluginhandler.js';
import { GatePluginHandler } from './gatepluginhandler.js';
import { IntegrationPluginHandler } from './integrationpluginhandler.js';
import { McpPluginHandler } from './mcppluginhandler.js';
import { existsSync } from 'fs';
import { basename, extname } from 'path';

// Plugin type to handler mapping
const PLUGIN_HANDLERS: Record<string, any> = {
  agent: AgentPluginHandler,
  quality_gate: GatePluginHandler,
  integration: IntegrationPluginHandler,
  mcp_tool: McpPluginHandler,
};

/**
 * Initialize the plugin system: discover, load, validate, and register all plugins.
 *
 * @param pluginsDir - Path to plugins directory
 * @param schemasDir - Path to schemas directory
 * @param options - Additional initialization options
 * @returns Object with loading statistics and details
 */
export function initializePlugins(
  pluginsDir?: string,
  schemasDir?: string,
  options: { agentRegistry?: any; watch?: boolean } = {}
) {
  const loader = new PluginLoader(pluginsDir, schemasDir);
  const { loaded, failed } = loader.loadAll();

  const registered: any[] = [];
  const registrationErrors: any[] = [];

  for (const plugin of loaded) {
    const handler = PLUGIN_HANDLERS[plugin.config.type];
    if (!handler) {
      registrationErrors.push({
        path: plugin.path,
        errors: [`No handler for plugin type: ${plugin.config.type}`],
      });
      continue;
    }

    let result;
    if (plugin.config.type === 'agent') {
      result = handler.register(plugin.config, options.agentRegistry);
    } else {
      result = handler.register(plugin.config);
    }

    if (result.success) {
      registered.push(plugin);
    } else {
      registrationErrors.push({
        path: plugin.path,
        errors: [result.error],
      });
    }
  }

  // Set up file watching if requested
  let stopWatching: (() => void) | null = null;
  if (options.watch) {
    stopWatching = loader.watchForChanges((_eventType: string, filePath: string) => {
      // Handle file deletion
      if (!existsSync(filePath)) {
        const name = basename(filePath, extname(filePath));
        for (const handler of Object.values(PLUGIN_HANDLERS)) {
          if (handler.unregister) handler.unregister(name);
        }
        return;
      }

      const { config } = loader.loadOne(filePath);
      if (config) {
        const handler = PLUGIN_HANDLERS[config.type];
        if (handler) {
          // Only unregister AFTER successful load and validation
          if (handler.unregister) handler.unregister(config.name);
          handler.register(config, options.agentRegistry);
        }
      }
      // If loadOne fails, keep old plugin registered (fail-safe)
    });
  }

  const allFailed = [...failed, ...registrationErrors];

  return {
    loaded: registered.length,
    failed: allFailed.length,
    details: {
      loaded: registered,
      failed: allFailed,
    },
    stopWatching: stopWatching || (() => {}),
  };
}

export {
  PluginValidator,
  PluginLoader,
  AgentPluginHandler as AgentPlugin,
  GatePluginHandler as GatePlugin,
  IntegrationPluginHandler as IntegrationPlugin,
  McpPluginHandler as MCPPlugin,
  parseSimpleYAML,
  BUILTIN_AGENT_NAMES,
  VALID_PLUGIN_TYPES,
};
