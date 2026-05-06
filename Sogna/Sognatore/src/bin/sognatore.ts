#!/usr/bin/env node
import { EnvOracle } from '../core/utils/EnvOracle.js';
EnvOracle.load();
import { Command } from 'commander';
import { Doctor } from '../core/Doctor.js';
import { Runner } from '../core/Runner.js';
import { Engine as PolicyEngine } from '../Sentinel-Sognatore/Engine.js';
import { SetupWizard } from '../core/utils/SetupWizard.js';
import { ProjectManager } from '../core/ProjectManager.js';
import { BootstrapEngine } from '../core/BootstrapEngine.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// Robust root discovery
const findRoot = (start: string): string => {
  let curr = start;
  const root = path.parse(curr).root;
  while (curr !== root) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.join(curr, '..');
  }
  return path.join(__dirname, '../../'); // Fallback
};

const sognatoreRoot = process.env.SOGNATORE_ROOT || findRoot(__dirname);
const packageJson = fs.readJsonSync(path.join(sognatoreRoot, 'package.json'));
const version = packageJson.version;

program
  .name('Sognatore')
  .description('Sognatore (Windows Native) - Multi-agent autonomous system')
  .version(version);

program
  .command('doctor')
  .description('Check system prerequisites for Windows')
  .option('--json', 'Output results as JSON')
  .option('--fix', 'Automatically repair fixable issues')
  .action(async (options) => {
    const doctor = new Doctor();
    const results = await doctor.checkAll();
    
    if (options.fix) {
      await doctor.heal(results);
      // Re-check after healing
      const finalResults = await doctor.checkAll();
      if (options.json) {
        console.log(JSON.stringify(finalResults, null, 2));
      } else {
        doctor.displayResults(finalResults);
      }
    } else {
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        doctor.displayResults(results);
      }
    }
  });

program
  .command('run')
  .description('Start autonomous Sognatore RARV cycle')
  .argument('[prd]', 'Path to PRD file')
  .option('--stress-test', 'Execute with maximum council intensity')
  .option('--mode <level>', 'Permission mode (readonly|balanced|full)', 'balanced')
  .action(async (prd, options) => {
    PolicyEngine.setGlobalMode(options.mode);
    const runner = new Runner();
    if (options.stressTest) {
      process.env.SOGNATORE_MAX_ITERATIONS = '20';
      process.env.SOGNATORE_QUALITY_TIER = 'High Assurance';
    }

    const bootstrap = BootstrapEngine.getInstance();
    const ready = await bootstrap.run();
    
    if (!ready) {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      process.exit(1);
    }

    // Start Sovereign Immune System (Swarm Concurrency)
    const { ImmuneSystem } = await import('../core/ImmuneSystem.js');
    await ImmuneSystem.start();

    await runner.start(prd);
  });

// Keep 'start' as an alias for 'run'
program
  .command('start')
  .description('Alias for "run"')
  .argument('[prd]', 'Path to PRD file')
  .option('--mode <level>', 'Permission mode (readonly|balanced|full)', 'balanced')
  .action(async (prd, options) => {
    PolicyEngine.setGlobalMode(options.mode);
    const runner = new Runner();
    await runner.start(prd);
  });

program
  .command('setup')
  .description('Configure API keys and project environment')
  .action(async () => {
    const wizard = new SetupWizard();
    await wizard.run();
  });

program
  .command('init')
  .description('Initialize a new independent Sognatore project')
  .argument('<name>', 'Name of the project folder')
  .action(async (name) => {
    const manager = new ProjectManager();
    await manager.initProject(name);
  });

program
  .command('upgrade')
  .description('Upgrade Sognatore core engine from master source')
  .action(async () => {
    const manager = new ProjectManager();
    await manager.upgrade();
  });

program.parse();

