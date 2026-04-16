// @sentinel-ignore
import { execa } from 'execa';
import chalk from 'chalk';
import os from 'os';
import { ProviderFactory } from './ProviderFactory.js';
import { ToolResolver } from './ToolResolver.js';
import fs from 'fs-extra';
import path from 'path';
import { Guardian } from './Guardian.js';
import { EnvOracle } from './utils/EnvOracle.js';

export interface DoctorResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  version?: string;
  message?: string;
  required: boolean;
  fix?: () => Promise<void>;
  fixLabel?: string;
}

export class Doctor {
  private toolResolver = new ToolResolver(process.cwd());
  private readonly ALLOWED_COMMANDS = ['node', 'git', 'docker', 'python', 'npm', 'pnpm', 'npx'];

  private async runSafeCommand(cmd: string, args: string[]): Promise<{ stdout: string }> {
    if (!this.ALLOWED_COMMANDS.includes(cmd)) {
      throw new Error(`[SECURITY] Execution blocked: Command "${cmd}" is not in the whitelist.`);
    }

    // Basic sanitization: No shell metacharacters in arguments
    const shellMetachars = /[|&;$><`!\\]/;
    for (const arg of args) {
      if (shellMetachars.test(arg)) {
        throw new Error(`[SECURITY] Execution blocked: Malicious characters detected in argument "${arg}".`);
      }
    }

    const resolved = this.toolResolver.resolve(cmd);
    return await execa(resolved, args);
  }

  async checkAll(): Promise<DoctorResult[]> {
    const results: DoctorResult[] = [];

    // Basic Tools
    results.push(await this.checkCommand('Node.js', 'node', true, '>=18.0.0'));
    results.push(await this.checkCommand('Python 3', 'python', true, '>=3.8.0'));
    results.push(await this.checkCommand('Git', 'git', true));
    
    // Sovereign Swarm Audit
    await this.checkSovereignAudit(results);

    // Connectivity Cert (Live Pings)
    await this.checkConnectivity(results);

    // Defensive Posture & Sanitization
    await this.checkDefensivePosture(results);
    
    // Disk Space (rough check)
    results.push(this.checkDiskSpace());

    return results;
  }

  private async checkSovereignAudit(results: DoctorResult[]) {
    const root = process.cwd();
    const catalogPath = path.join(root, 'resources', 'config', 'swarm_catalog.json');
    const strategyPath = path.join(root, 'resources', 'config', 'model_strategy.json');

    // 1. Catalog Sync
    if (fs.existsSync(catalogPath)) {
      results.push({
        name: 'Swarm Catalog',
        status: 'PASS',
        required: true
      });
    } else {
      results.push({
        name: 'Swarm Catalog',
        status: 'FAIL',
        message: 'Master swarm_catalog.json missing.',
        required: true
      });
    }

    // 2. Multi-Provider Resilience
    if (fs.existsSync(strategyPath)) {
      try {
        const strategy = fs.readJsonSync(strategyPath);
        const weakTiers = Object.keys(strategy.tiers).filter(t => strategy.tiers[t].models.length < 2);
        results.push({
          name: 'Multi-Provider Resilience',
          status: weakTiers.length === 0 ? 'PASS' : 'WARN',
          message: weakTiers.length > 0 ? `Low redundancy in tiers: ${weakTiers.join(', ')}` : undefined,
          required: false
        });
      } catch (e) {
        results.push({ name: 'Model Strategy', status: 'FAIL', message: 'model_strategy.json corrupted.', required: true });
      }
    }

    // 3. Docker Sandbox Image
    try {
      const { stdout } = await this.runSafeCommand('docker', ['images', 'asklokesh/loki-mode:latest', '--format', '{{.Repository}}']);
      results.push({
        name: 'Docker Sandbox Image',
        status: stdout.includes('loki-mode') ? 'PASS' : 'WARN',
        message: stdout.includes('loki-mode') ? undefined : 'Sovereign Sandbox image missing.',
        required: false,
        fixLabel: 'Download Sandbox Image',
        fix: async () => {
          console.log(chalk.blue('  - Pulling asklokesh/loki-mode:latest...'));
          await this.runSafeCommand('docker', ['pull', 'asklokesh/loki-mode:latest']);
        }
      });
    } catch (e) {
      results.push({ name: 'Docker Sandbox', status: 'FAIL', message: 'Docker not running or not found.', required: false });
    }
  }

  private async checkConnectivity(results: DoctorResult[]) {
    EnvOracle.load(); // Ensure keys are loaded into process.env
    const providers = [
      { id: 'gemini', env: 'GOOGLE_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/models?key=' },
      { id: 'claude', env: 'ANTHROPIC_API_KEY', url: 'https://api.anthropic.com/v1/messages' },
      { id: 'openai', env: 'OPENAI_API_KEY', url: 'https://api.openai.com/v1/models' }
    ];

    for (const p of providers) {
      let key = process.env[p.env];
      
      // Support common aliases
      if (!key && p.id === 'gemini') key = process.env['GEMINI_API_KEY'];
      if (!key && p.id === 'openai') key = process.env['OPENAI_API_KEY'];
      if (!key && p.id === 'claude') key = process.env['ANTHROPIC_API_KEY'];

      if (!key) {
        results.push({
          name: `${p.id.charAt(0).toUpperCase() + p.id.slice(1)} Connectivity`,
          status: 'WARN',
          message: `API Key (${p.env}) not configured in .env`,
          required: false
        });
        continue;
      }

      try {
        let isSuccess = false;
        if (p.id === 'gemini') {
          const resp = await fetch(`${p.url}${key}`);
          isSuccess = resp.status === 200;
        } else if (p.id === 'claude') {
          // Anthropic requires headers. We send a dummy message with max_tokens: 1
          const resp = await fetch(p.url, {
            method: 'POST',
            headers: {
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'ping' }]
            })
          });
          isSuccess = resp.status === 200 || resp.status === 400; // 400 is fine as long as key is accepted
        } else {
          // OpenAI Models list check
          const resp = await fetch(p.url, {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          isSuccess = resp.status === 200;
        }

        results.push({
          name: `${p.id.charAt(0).toUpperCase() + p.id.slice(1)} Connectivity`,
          status: isSuccess ? 'PASS' : 'WARN',
          message: isSuccess ? undefined : `API returned status ${isSuccess ? 'OK' : 'Unauthorized/Error'}`,
          required: false
        });
      } catch (e) {
        results.push({
          name: `${p.id.charAt(0).toUpperCase() + p.id.slice(1)} Connectivity`,
          status: 'WARN',
          message: `Network error: ${e instanceof Error ? e.message : String(e)}`,
          required: false
        });
      }
    }
  }

  private async checkDefensivePosture(results: DoctorResult[]) {
    // 1. Guardian Secret & Sentinel Engine
    const guardian = Guardian.getInstance();
    const rootHash = guardian.validateIntegrity(); // This will trigger EnvOracle and Secret check internally
    
    // Check Sentinel Script (Look in project root)
    const projectRoot = fs.existsSync(path.join(process.cwd(), 'toolkit')) 
      ? process.cwd() 
      : path.join(process.cwd(), '..');
    
    const sentinelPath = path.join(projectRoot, 'toolkit', 'engines', 'sentinel', 'bin', 'sentinel-veto.js');
    const sentinelExists = fs.existsSync(sentinelPath);

    results.push({
      name: 'Defensive Engine (Sentinel)',
      status: sentinelExists ? 'PASS' : 'FAIL',
      message: sentinelExists ? `Sovereign Root Hash: ${rootHash.substring(0, 12)}...` : `Sentinel Engine missing at ${sentinelPath}`,
      required: true
    });

    // 2. .gitignore Presence
    let gitignorePath = '';
    const searchPaths = [path.join(process.cwd(), '.gitignore'), path.join(process.cwd(), '..', '.gitignore')];
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        gitignorePath = p;
        break;
      }
    }

    results.push({
      name: 'VCS Protection',
      status: gitignorePath ? 'PASS' : 'WARN',
      message: gitignorePath ? undefined : '.gitignore missing in root or parent.',
      required: false,
      fixLabel: 'Create .gitignore',
      fix: async () => {
        const content = 'node_modules/\ndist/\n.env\n.sognatore/\nlint_report_*.json\nlint_output_*.txt\n';
        await fs.writeFile(path.join(process.cwd(), '.gitignore'), content);
      }
    });

    // 3. Sanitization (Ghost Hunter)
    const ghostPatterns = [
      'lint_report_*.json',
      'lint_output_*.txt',
      'SovereignAudit.ts',
      'SovereignAudit.js'
    ];
    
    const ghosts: string[] = [];
    const files = await fs.readdir(process.cwd());
    for (const file of files) {
      if (ghostPatterns.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(file);
      })) {
        ghosts.push(file);
      }
    }

    if (ghosts.length > 0) {
      results.push({
        name: 'Repository Sanitization',
        status: 'WARN',
        message: `Found ${ghosts.length} temporary diagnostic files.`,
        required: false,
        fixLabel: 'Purge Ghost Files',
        fix: async () => {
          for (const g of ghosts) {
            await fs.remove(path.join(process.cwd(), g));
          }
        }
      });
    }
  }

  async heal(results: DoctorResult[]) {
    console.log(chalk.bold.blue('\n--- Inicia Proceso de Auto-Sanado (Self-Healing) ---\n'));
    for (const r of results) {
      if (r.status !== 'PASS' && r.fix) {
        console.log(chalk.yellow(`🛠  Reparando: ${r.name}...`));
        try {
          await r.fix();
          console.log(chalk.green(`  ✓ Éxito: ${r.name} reparado.`));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(chalk.red(`  ✗ Error al reparar ${r.name}: ${msg}`));
        }
      }
    }
  }

  private async checkCommand(name: string, cmd: string, required: boolean, versionRange?: string): Promise<DoctorResult> {
    const isPresent = await this.toolResolver.isAvailable(cmd);
    
    if (isPresent) {
      try {
        const { stdout } = await this.runSafeCommand(cmd, ['--version']);
        return {
          name,
          status: 'PASS',
          version: stdout.split('\n')[0].trim(),
          required
        };
      } catch (error: unknown) {
        return { name, status: 'PASS', required };
      }
    }

    return {
      name,
      status: required ? 'FAIL' : 'WARN',
      message: `${name} is not installed locally or in PATH.${versionRange ? ` Required: ${versionRange}` : ''}`,
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
      let version: string | undefined = undefined;
      if (isPresent) {
        try { 
          version = await p.version(); 
        } catch (error: unknown) {
          // Version detection fail is not critical
        }
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
      let statusStr: string;
      if (r.status === 'PASS') statusStr = chalk.green('  PASS  ');
      else if (r.status === 'FAIL') {
        statusStr = chalk.red('  FAIL  ');
        if (r.required) allRequiredPassed = false;
      } else statusStr = chalk.yellow('  WARN  ');

      const versionStr = r.version ? chalk.dim(` (${r.version})`) : '';
      console.log(`${statusStr} ${r.name}${versionStr}`);
      if (r.message && r.status !== 'PASS') {
        const fixHint = r.fixLabel ? chalk.cyan(` [Auto-Fixable: ${r.fixLabel}]`) : '';
        console.log(chalk.dim(`         └─ ${r.message}${fixHint}`));
      }
    }

    console.log('\n' + (allRequiredPassed 
      ? chalk.green('✔ System is ready for Sognatore.') 
      : chalk.red('✘ System is missing required prerequisites.')));
  }
}
