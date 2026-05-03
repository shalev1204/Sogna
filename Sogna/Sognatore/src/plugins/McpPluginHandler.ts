import { execFile } from 'child_process';
import { McpToolPluginConfig } from './plugintypes.js';

// In-memory registry for custom MCP tool plugins
const _registeredTools = new Map<string, any>();

export class McpPluginHandler {
  /**
   * Register a custom MCP tool plugin.
   *
   * @param pluginConfig - Validated MCP tool plugin config
   * @returns Success status and optional error message
   */
  public static register(pluginConfig: McpToolPluginConfig): { success: boolean; error?: string } {
    if (!pluginConfig || pluginConfig.type !== 'mcp_tool') {
      return { success: false, error: 'Invalid plugin config: type must be "mcp_tool"' };
    }

    const name = pluginConfig.name;

    if (_registeredTools.has(name)) {
      return { success: false, error: `MCP tool plugin "${name}" is already registered` };
    }

    const toolDef = {
      name: name,
      description: pluginConfig.description,
      command: pluginConfig.command,
      parameters: pluginConfig.parameters || [],
      timeout_ms: (pluginConfig as any).timeout_ms || 30000,
      working_directory: (pluginConfig as any).working_directory || 'project',
      registered_at: new Date().toISOString(),
    };

    _registeredTools.set(name, toolDef);
    return { success: true };
  }

  /**
   * Unregister a custom MCP tool plugin.
   *
   * @param pluginName - Name of the tool to remove
   * @returns Success status and optional error message
   */
  public static unregister(pluginName: string): { success: boolean; error?: string } {
    if (!_registeredTools.has(pluginName)) {
      return { success: false, error: `MCP tool plugin "${pluginName}" is not registered` };
    }

    _registeredTools.delete(pluginName);
    return { success: true };
  }

  /**
   * Execute an MCP tool command with parameter substitution.
   *
   * @param pluginConfig - The MCP tool plugin config
   * @param params - Input parameters
   * @param projectDir - Project directory for sandbox
   * @returns Promise resolving to the result of the tool execution
   */
  public static async execute(
    pluginConfig: McpToolPluginConfig, 
    params: Record<string, any>, 
    projectDir?: string
  ): Promise<{ success: boolean; output: string; duration_ms: number }> {
    const command = pluginConfig.command;
    const timeoutMs = (pluginConfig as any).timeout_ms || 30000;
    const startTime = Date.now();

    if (!command) {
      return {
        success: false,
        output: 'Error: no command specified for MCP tool',
        duration_ms: 0,
      };
    }

    // Substitute parameters into command with shell-safe quoting
    let resolvedCommand = command;
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        const safeValue = McpPluginHandler._sanitizeValue(value);
        resolvedCommand = resolvedCommand.replace(
          new RegExp(`\\\\{\\\\{params\\\\.${key}\\\\}\\\\}`, 'g'),
          safeValue
        );
      }
    }

    return new Promise((resolve) => {
      const cwd = projectDir || process.cwd();
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/c', resolvedCommand] : ['-c', resolvedCommand];

      execFile(shell, shellArgs, {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024, // 1MB
        env: { ...process.env, SOGNATORE_MCP_TOOL: pluginConfig.name || 'unknown' },
      }, (error: any, stdout: string, stderr: string) => {
        const durationMs = Date.now() - startTime;
        const output = (stdout || '') + (stderr ? '\n' + stderr : '');

        if (error) {
          if (error.killed) {
            resolve({
              success: false,
              output: `Timeout: command exceeded ${timeoutMs}ms limit`,
              duration_ms: durationMs,
            });
          } else {
            resolve({
              success: false,
              output: output.trim() || error.message || 'Command failed',
              duration_ms: durationMs,
            });
          }
        } else {
          resolve({
            success: true,
            output: output.trim(),
            duration_ms: durationMs,
          });
        }
      });
    });
  }

  /**
   * Get the MCP tool definition in a format suitable for MCP protocol.
   *
   * @param name - Tool name
   * @returns MCP-compatible tool definition
   */
  public static getMCPDefinition(name: string): any | null {
    const tool = _registeredTools.get(name);
    if (!tool) return null;

    const inputSchema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    for (const param of tool.parameters) {
      inputSchema.properties[param.name] = {
        type: param.type || 'string',
        description: param.description || '',
      };
      if (param.default !== undefined) {
        inputSchema.properties[param.name].default = param.default;
      }
      if (param.required) {
        inputSchema.required.push(param.name);
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
    };
  }

  /**
   * List all registered MCP tool plugins.
   *
   * @returns Array of tool definitions
   */
  public static listRegistered(): any[] {
    return Array.from(_registeredTools.values());
  }

  /**
   * Shell-safe value sanitization.
   * On Unix: Wrapped in single quotes with internal single quotes escaped.
   * On Windows: Wrapped in double quotes with internal double quotes escaped.
   *
   * @param value - The value to sanitize
   * @returns Shell-safe quoted string
   */
  private static _sanitizeValue(value: any): string {
    const str = String(value);
    if (process.platform === 'win32') {
      // Windows command line (cmd.exe) escaping: double up quotes
      return '"' + str.replace(/"/g, '""') + '"';
    } else {
      // Unix shell (sh/bash) escaping: single quote wrap
      return "'" + str.replace(/'/g, "'\\''") + "'";
    }
  }

  /**
   * Clear all registered tools (primarily for testing).
   */
  public static _clearAll(): void {
    _registeredTools.clear();
  }
}
