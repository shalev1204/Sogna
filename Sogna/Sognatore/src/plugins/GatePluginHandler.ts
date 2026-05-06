import { execFile } from 'child_process';
import { QualityGatePluginConfig } from './PluginTypes.js';

// In-memory registry for custom gate plugins
const _registeredGates = new Map<string, any>();

export class GatePluginHandler {
  /**
   * Register a custom quality gate plugin.
   *
   * @param pluginConfig - Validated quality gate plugin config
   * @returns Success status and optional error message
   */
  public static register(pluginConfig: QualityGatePluginConfig): { success: boolean; error?: string } {
    if (!pluginConfig || pluginConfig.type !== 'quality_gate') {
      return { success: false, error: 'Invalid plugin config: type must be "quality_gate"' };
    }

    const name = pluginConfig.name;

    if (_registeredGates.has(name)) {
      return { success: false, error: `Gate plugin "${name}" is already registered` };
    }

    const gateDef = {
      name: name,
      description: pluginConfig.description,
      check_type: pluginConfig.check_type,
      threshold: pluginConfig.threshold,
      action: pluginConfig.action,
      parameters: pluginConfig.parameters || {},
      registered_at: new Date().toISOString(),
    };

    _registeredGates.set(name, gateDef);
    return { success: true };
  }

  /**
   * Unregister a custom quality gate plugin.
   *
   * @param pluginName - Name of the gate plugin to remove
   * @returns Success status and optional error message
   */
  public static unregister(pluginName: string): { success: boolean; error?: string } {
    if (!_registeredGates.has(pluginName)) {
      return { success: false, error: `Gate plugin "${pluginName}" is not registered` };
    }

    _registeredGates.delete(pluginName);
    return { success: true };
  }

  /**
   * Execute a quality gate command.
   *
   * @param pluginConfig - The gate plugin config
   * @param projectDir - Project directory to run the command in
   * @returns Promise resolving to the result of the check
   */
  public static async execute(
    pluginConfig: QualityGatePluginConfig, 
    projectDir?: string
  ): Promise<{ passed: boolean; output: string; duration_ms: number }> {
    // Note: The generic PluginConfig might not have 'command' directly if it's not and McpTool
    // but the actual QualityGate handler in .js was using a 'command' field.
    // I'll add 'command' to the internal parameters or check if it's provided in config.
    const command = (pluginConfig as any).command;
    const timeoutMs = (pluginConfig as any).timeout_ms || 30000;
    const startTime = Date.now();

    if (!command) {
      return {
        passed: false,
        output: 'Error: no command specified for quality gate',
        duration_ms: 0,
      };
    }

    return new Promise((resolve) => {
      const cwd = projectDir || process.cwd();
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';
      const args = isWindows ? ['/c', command] : ['-c', command];

      execFile(shell, args, {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024, // 1MB
        env: { ...process.env, SOGNATORE_GATE: pluginConfig.name || 'unknown' },
      }, (error: any, stdout: string, stderr: string) => {
        const durationMs = Date.now() - startTime;
        const output = (stdout || '') + (stderr ? '\n' + stderr : '');

        if (error) {
          if (error.killed || (error as any).code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
            resolve({
              passed: false,
              output: `Timeout: command exceeded ${timeoutMs}ms limit`,
              duration_ms: durationMs,
            });
          } else {
            resolve({
              passed: false,
              output: output.trim() || error.message || 'Command failed',
              duration_ms: durationMs,
            });
          }
        } else {
          resolve({
            passed: true,
            output: output.trim(),
            duration_ms: durationMs,
          });
        }
      });
    });
  }

  /**
   * List all registered gate plugins.
   *
   * @returns Array of gate definitions
   */
  public static listRegistered(): any[] {
    return Array.from(_registeredGates.values());
  }

  /**
   * Check if a gate is registered.
   *
   * @param name - Gate name
   * @returns True if registered
   */
  public static isRegistered(name: string): boolean {
    return _registeredGates.has(name);
  }

  /**
   * Clear all registered gates (primarily for testing).
   */
  public static _clearAll(): void {
    _registeredGates.clear();
  }
}
