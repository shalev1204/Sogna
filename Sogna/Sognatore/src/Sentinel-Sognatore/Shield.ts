import { Engine } from './Engine.js';
import { Hub, SecurityState } from './Hub.js';
import { PermissionMode, ValidationResult } from './SecurityTypes.js';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';
import * as os from 'os';
import * as path from 'path';

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
      const args = command.split(/\s+/);
      
      const isPathTraversal = args.some(arg => arg.includes('../') && (arg.includes('/') || arg.includes('\\')));
      if (isPathTraversal) {
        hub.reportIntel('WARNING', `Intento de Path Traversal bloqueado: ${command}`, 'Shield');
        return { allow: false, reason: 'Directory traversal (../) is restricted in this mode.' };
      }
      
      const systemDirs = ['/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev', 'c:\\windows', 'c:\\users'];
      const cleanArgs = args.map(arg => arg.replace(/['"]/g, ''));
      const targetsSystem = cleanArgs.some(arg => 
        systemDirs.some(dir => arg.toLowerCase().startsWith(dir.toLowerCase())) || arg === '/' || arg === '\\'
      );
      
      if (targetsSystem) {
        hub.reportIntel('CRITICAL', `Intento de acceso a ruta de sistema bloqueado`, 'Shield');
        return { allow: false, reason: `System path targets are restricted in this mode.` };
      }
    }

    // 2. Rule-based blocking (System Parity)
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

  /**
   * Sanitizes prompts by removing path patterns, secrets, sensitive names, and potential leaks.
   */
  static sanitizePrompt(prompt: string): string {
    if (!prompt) return '';
    let sanitized = prompt;

    try {
      const config = ConfigDiscovery.getInstance().getConfig();
      const privacy = config.privacy_shield;

      if (!privacy || privacy.redact_pii !== true) {
        return sanitized;
      }

      // 1. Redact Absolute Paths (Windows & Unix style)
      const workspaceRoot = process.cwd();
      const userHome = os.homedir();

      // Redact the exact workspace directory path
      const escWorkspace = workspaceRoot.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escWorkspace, 'gi'), '[WORKSPACE_DIR]');

      // Redact the exact user home directory path
      const escHome = userHome.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escHome, 'gi'), '[USER_HOME_DIR]');

      // Redact generic Windows User path: C:\Users\xxx
      const winUserRegex = /[a-zA-Z]:\\[Uu]sers\\[a-zA-Z0-9_-]+/gi;
      sanitized = sanitized.replace(winUserRegex, '[USER_HOME_DIR]');

      // Redact generic Unix/macOS User path: /Users/xxx or /home/xxx
      const unixUserRegex = /\/(home|Users)\/[a-zA-Z0-9_-]+/gi;
      sanitized = sanitized.replace(unixUserRegex, '/$1/[OPERATOR]');

      // 2. Redact Emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');

      // 3. Redact Secrets & Credentials if redact_secrets is enabled
      if (privacy.redact_secrets === true) {
        // Redact standard API keys
        const openaiKeyRegex = /sk-[a-zA-Z0-9]{48}/g;
        sanitized = sanitized.replace(openaiKeyRegex, '[REDACTED_OPENAI_KEY]');

        const anthropicKeyRegex = /sk-ant-api03-[a-zA-Z0-9-_]{95}/g;
        sanitized = sanitized.replace(anthropicKeyRegex, '[REDACTED_ANTHROPIC_KEY]');

        // Redact key/value pairs like api_key = "..." or password = "..."
        const secretsRegex = /(password|passwd|api[-_]?key|secret|token|private[-_]?key)\s*[:=]\s*['"]?[a-zA-Z0-9-_]{8,}['"]?/gi;
        sanitized = sanitized.replace(secretsRegex, '$1: [REDACTED_SECRET]');
      }

      // 4. Custom Redactions from .sognarc.json
      if (privacy.custom_redactions) {
        for (const [key, replacement] of Object.entries(privacy.custom_redactions)) {
          const escKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(escKey, 'gi');
          sanitized = sanitized.replace(regex, replacement as string);
        }
      }

      // 5. Redact current OS username dynamically
      try {
        const username = os.userInfo().username;
        if (username && username.length > 2) {
          const escUser = username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(escUser, 'gi');
          sanitized = sanitized.replace(regex, '[OPERATOR]');
        }
      } catch {
        // Username retrieval failed
      }

    } catch (e) {
      console.error('[Shield] Prompt sanitization failed, proceeding with original prompt:', e);
    }

    return sanitized;
  }
}


