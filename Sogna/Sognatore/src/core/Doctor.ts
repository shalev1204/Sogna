import { execa } from 'execa';
import chalk from 'chalk';
import os from 'os';
import { ProviderFactory } from './ProviderFactory.js';
import { ToolResolver } from './ToolResolver.js';

export interface DoctorResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  version?: string;
  message?: string;
  required: boolean;
}

export class Doctor {
  private toolResolver = new ToolResolver(process.cwd());

  async checkAll(): Promise<DoctorResult[]> {
    const results: DoctorResult[] = [];

    // Basic Tools
    results.push(await this.checkCommand('Node.js', 'node', true, '>=18.0.0'));
    results.push(await this.checkCommand('Python 3', 'python', true, '>=3.8.0'));
    results.push(await this.checkCommand('Git', 'git', true));
    
    // AI Providers
    await this.checkProviders(results);

    // Development Tools (Gate Prerequisites)
    results.push(await this.checkCommand('ESLint', 'eslint', false));
    results.push(await this.checkCommand('TypeScript', 'tsc', false));

    // Disk Space (rough check)
    results.push(this.checkDiskSpace());

    return results;
  }

  private async checkCommand(name: string, cmd: string, required: boolean, versionSpec?: string): Promise<DoctorResult> {
    const isPresent = await this.toolResolver.isAvailable(cmd);
    
    if (isPresent) {
      try {
        const resolved = this.toolResolver.resolve(cmd);
        const { stdout } = await execa(resolved, ['--version']);
        return {
          name,
          status: 'PASS',
          version: stdout.split('\n')[0].trim(),
          required
        };
      } catch {
        return { name, status: 'PASS', required };
      }
    }

    return {
      name,
      status: required ? 'FAIL' : 'WARN',
      message: `${name} is not installed locally or in PATH.`,
      required
    };
  }

  private async checkProviders(results: DoctorResult[]) {
    const providers = [
      ProviderFactory.getProvider('gemini'),
      ProviderFactory.getProvider('claude'),
      ProviderFactory.getProvider('aider')
    ];

    for (const p of providers) {
      const isPresent = await p.detect();
      let version = undefined;
      if (isPresent) {
        try { version = await p.version(); } catch {}
      }

      results.push({
        name: p.metadata.displayName,
        status: isPresent ? 'PASS' : 'WARN',
        version,
        message: isPresent ? undefined : `${p.metadata.cli} CLI not found.`,
        required: false
      });
    }
  }

  private checkDiskSpace(): DoctorResult {
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
    console.log(chalk.bold('\nSognatore Doctor (Windows Native)'));
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
      ? chalk.green('✔ System is ready for Sognatore.') 
      : chalk.red('✘ System is missing required prerequisites.')));
  }
}
