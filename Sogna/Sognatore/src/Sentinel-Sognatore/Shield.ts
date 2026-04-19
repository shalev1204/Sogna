import { Engine } from './Engine.js';
import { Hub, SecurityState } from './Hub.js';

export enum PermissionMode {
  ReadOnly = 'readonly',
  Balanced = 'balanced',
  Full = 'full'
}

export interface ValidationResult {
  allow: boolean;
  warn?: boolean;
  reason?: string;
}

/**
 * Sentinel Shield - Terminal enforcement part of the Sentinel-Sognatore block.
 */
export class Shield {
  /**
   * Extracts the first command from a string, handling env vars and sudo.
   */
  static extractFirstCommand(command: string): string {
    const trimmed = command.trim();
    if (!trimmed) return '';

    const parts = trimmed.split(/\s+/);
    let i = 0;
    while (i < parts.length && parts[i].includes('=')) {
      i++;
    }

    let cmd = parts[i] || '';
    if (cmd === 'sudo') {
      i++;
      while (i < parts.length && parts[i].startsWith('-')) {
        i++;
      }
      cmd = parts[i] || '';
    }

    return cmd;
  }

  /**
   * Validates a command against a permission mode and workspace.
   */
  static validate(command: string, mode: PermissionMode, workspace?: string): ValidationResult {
    const engine = Engine.getInstance();
    const hub = Hub.getInstance();
    
    // Enforcement: Override mode to ReadOnly if Hub is in PANIC
    const effectiveMode = hub.getState() === SecurityState.PANIC ? PermissionMode.ReadOnly : mode;

    const result = engine.validateCommand(command);

    // 1. Path Traversal & Out-of-Workspace (Balanced/ReadOnly)
    if (effectiveMode !== PermissionMode.Full) {
      if (command.includes('../')) {
        hub.reportIntel('WARNING', `Intento de Path Traversal bloqueado: ${command}`, 'Shield');
        return { allow: false, reason: 'Directory traversal (../) is restricted in this mode.' };
      }
      
      const absolutePathPattern = /[\s'"](\/[a-z]+|~)/i;
      const match = command.match(absolutePathPattern);
      if (match) {
        const pathStr = match[0].trim().replace(/['"]/g, '');
        const systemDirs = ['/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev'];
        if (systemDirs.some(dir => pathStr.startsWith(dir)) || pathStr === '/') {
          hub.reportIntel('CRITICAL', `Intento de acceso a ruta de sistema bloqueado: ${pathStr}`, 'Shield');
          return { allow: false, reason: `System path "${pathStr}" targets are restricted in this mode.` };
        }
      }
    }

    // 2. Rule-based blocking (Institutional Parity)
    if (!result.isSafe) {
        const violations = result.violations.join('; ');
        if (effectiveMode === PermissionMode.ReadOnly || result.category === 'DANGER_ZONE') {
            hub.reportIntel('WARNING', `Comando denegado por política (${result.category}): ${violations}`, 'Shield');
            return { allow: false, reason: violations };
        }
        hub.reportIntel('INFO', `Comando sospechoso permitido con advertencia: ${violations}`, 'Shield');
        return { allow: true, warn: true, reason: violations };
    }

    // 3. Category Protections in ReadOnly
    if (effectiveMode === PermissionMode.ReadOnly && result.category !== 'READ_ONLY') {
        const panicReason = hub.getState() === SecurityState.PANIC ? ' (FORCED BY SECURITY PANIC)' : '';
        hub.reportIntel('WARNING', `Comando bloqueado por Modo ReadOnly${panicReason}: ${command}`, 'Shield');
        return { allow: false, reason: `Command classified as "${result.category}" is not allowed in ReadOnly mode${panicReason}.` };
    }

    return { allow: true };
  }
}


