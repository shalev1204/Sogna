import { PolicyEngine } from '@sogna/toolkit';

export class BashShield {
  /**
   * Extracts the first command from a string, handling env vars and sudo.
   */
  static extractFirstCommand(command: string): string {
    const trimmed = command.trim();
    if (!trimmed) return '';

    // Simplified env var skipping (handles KEY=val ...)
    const parts = trimmed.split(/\s+/);
    let i = 0;
    while (i < parts.length && parts[i].includes('=')) {
      i++;
    }

    let cmd = parts[i] || '';
    if (cmd === 'sudo') {
      // Skip flags and take the next part
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
    const policy = PolicyEngine.getInstance();
    const result = policy.validateCommand(command);

    // 1. Path Traversal & Out-of-Workspace (Balanced/ReadOnly)
    if (mode !== PermissionMode.Full) {
      if (command.includes('../')) {
        return { allow: false, reason: 'Directory traversal (../) is restricted in this mode.' };
      }
      
      const absolutePathPattern = /[\s'"](\/[a-z]+|~)/i;
      const match = command.match(absolutePathPattern);
      if (match) {
        const pathStr = match[0].trim().replace(/['"]/g, '');
        const systemDirs = ['/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev'];
        if (systemDirs.some(dir => pathStr.startsWith(dir)) || pathStr === '/') {
          return { allow: false, reason: `System path "${pathStr}" targets are restricted in this mode.` };
        }
      }
    }

    // 2. Rule-based blocking (Institutional Parity)
    if (!result.isSafe) {
        if (mode === PermissionMode.ReadOnly || result.category === 'DANGER_ZONE') {
            return { allow: false, reason: result.violations.join('; ') };
        }
        return { allow: true, warn: true, reason: result.violations.join('; ') };
    }

    // 3. Category Protections in ReadOnly
    if (mode === PermissionMode.ReadOnly && result.category !== 'READ_ONLY') {
        return { allow: false, reason: `Command classified as "${result.category}" is not allowed in ReadOnly mode.` };
    }

    return { allow: true };
  }
}
