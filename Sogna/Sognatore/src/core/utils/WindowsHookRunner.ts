import { Color, FS as fs } from '@Sogna/Curator';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { Hub } from '../../Sentinel-Sognatore/Hub.js';

const execAsync = util.promisify(exec);

export class WindowsHookRunner {
  /**
   * Translates and executes a command that might contain Unix-isms.
   * This is a "compatibility layer" for the high-assurance system.
   */
  static async run(command: string, cwd: string = process.cwd()): Promise<string> {
    let normalizedCommand = command;

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
      console.log(Color.dim(`  [HOOK] Executing: ${normalizedCommand}`));
      const { stdout } = await execAsync(normalizedCommand, { 
        cwd, 
        shell: 'powershell.exe'
      });
      return stdout.toString();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(Color.red(`  [HOOK ERROR] Failed to execute hook: ${message}`));
      return '';
    }
  }

  /**
   * Triggers the "stagnation-hook" equivalent on Windows.
   */
  static async triggerStagnationHook() {
    console.log(Color.yellow(`\n[RECOVERY] Stagnation detected. Running recovery hooks...`));
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    await this.run('touch .sognatore/STAGNANT', sognatoreRoot);
  }

  /**
   * Cleans up temporary agents and PIDs, mirroring the init_pid_registry logic.
   */
  static cleanupRegistry() {
    const sognatoreRoot = Hub.getInstance().getSognatoreRoot();
    const pidDir = path.join(sognatoreRoot, '.sognatore', 'pids');
    if (fs.existsSync(pidDir)) {
      console.log(Color.cyan(`[CLEANUP] Purging Windows PID registry...`));
      fs.emptyDirSync(pidDir);
    }
  }
}

