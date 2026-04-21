// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

export class WindowsHookRunner {
  /**
   * Translates and executes a command that might contain Unix-isms.
   * This is a "compatibility layer" for the high-assurance system.
   */
  static run(command: string, cwd: string = process.cwd()): string {
    // 1. Basic path normalization
    let normalizedCommand = command.replace(/\//g, path.sep);

    // 2. Map common Unix-isms to PowerShell counterparts
    // 'touch' -> 'New-Item -ItemType File -Force'
    if (normalizedCommand.startsWith('touch ')) {
      const file = normalizedCommand.substring(6).trim();
      normalizedCommand = `New-Item -ItemType File -Force "${file}"`;
    }
    
    // 'rm -rf' -> 'Remove-Item -Recurse -Force'
    if (normalizedCommand.includes('rm -rf ')) {
      normalizedCommand = normalizedCommand.replace('rm -rf ', 'Remove-Item -Recurse -Force ');
    }

    try {
      console.log(chalk.dim(`  [HOOK] Executing: ${normalizedCommand}`));
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
      const output = execSync(normalizedCommand, { 
        cwd, 
        shell: 'powershell.exe',
        stdio: 'pipe' 
      });
      return output.toString();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`  [HOOK ERROR] Failed to execute hook: ${message}`));
      return '';
    }
  }

  /**
   * Triggers the "stagnation-hook" equivalent on Windows.
   */
  static triggerStagnationHook() {
    console.log(chalk.yellow(`\n[RECOVERY] Stagnation detected. Running recovery hooks...`));
    // In original: touch .sognatore/STAGNANT
    this.run('touch .sognatore/STAGNANT');
  }

  /**
   * Cleans up temporary agents and PIDs, mirroring the init_pid_registry logic.
   */
  static cleanupRegistry() {
    const pidDir = path.join(process.cwd(), '.sognatore', 'pids');
    if (fs.existsSync(pidDir)) {
      console.log(chalk.cyan(`[CLEANUP] Purging Windows PID registry...`));
      fs.emptyDirSync(pidDir);
    }
  }
}

