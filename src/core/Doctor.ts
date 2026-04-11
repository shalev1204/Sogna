import { execa } from 'execa';
import chalk from 'chalk';
import os from 'os';

export interface DoctorResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  version?: string;
  message?: string;
  required: boolean;
}

export class Doctor {
  async checkAll(): Promise<DoctorResult[]> {
    const results: DoctorResult[] = [];

    // Basic Tools
    results.push(await this.checkCommand('Node.js', 'node', true, '>=18.0.0'));
    results.push(await this.checkCommand('Python 3', 'python', true, '>=3.8.0'));
    results.push(await this.checkCommand('Git', 'git', true));
    
    // AI Providers
    results.push(await this.checkCommand('Claude CLI', 'claude', false));
    results.push(await this.checkCommand('Gemini CLI', 'gemini', false));
    results.push(await this.checkCommand('Codex CLI', 'codex', false));
    results.push(await this.checkCommand('Aider CLI', 'aider', false));

    // Disk Space (rough check)
    results.push(this.checkDiskSpace());

    return results;
  }

  private async checkCommand(name: string, cmd: string, required: boolean, versionSpec?: string): Promise<DoctorResult> {
    try {
      const { stdout } = await execa(cmd, ['--version']);
      const version = stdout.trim();
      return {
        name,
        status: 'PASS',
        version,
        required
      };
    } catch (error) {
      return {
        name,
        status: required ? 'FAIL' : 'WARN',
        message: `${name} is not installed or not in PATH.`,
        required
      };
    }
  }

  private checkDiskSpace(): DoctorResult {
    // os.freemem() is for RAM, for disk we'd need a lib, but let's do a simple check
    const freeMemGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
    return {
      name: 'System RAM',
      status: freeMemGB > 1 ? 'PASS' : 'WARN',
      version: `${freeMemGB}GB free`,
      message: freeMemGB <= 1 ? 'Low memory might affect performance.' : undefined,
      required: false
    };
  }

  displayResults(results: DoctorResult[]) {
    console.log(chalk.bold('\nLoki Mode Doctor (Windows Native)'));
    console.log('Checking system prerequisites...\n');

    let allRequiredPassed = true;

    for (const r of results) {
      let statusStr = '';
      if (r.status === 'PASS') statusStr = chalk.green('  PASS  ');
      else if (r.status === 'FAIL') {
        statusStr = chalk.red('  FAIL  ');
        if (r.required) allRequiredPassed = false;
      } else statusStr = chalk.yellow('  WARN  ');

      const versionStr = r.version ? chalk.dim(` (${r.version})`) : '';
      console.log(`${statusStr} ${r.name}${versionStr}`);
      if (r.message && r.status !== 'PASS') {
        console.log(chalk.dim(`         └─ ${r.message}`));
      }
    }

    console.log('\n' + (allRequiredPassed 
      ? chalk.green('✔ System is ready for Loki Mode.') 
      : chalk.red('✘ System is missing required prerequisites.')));
  }
}
