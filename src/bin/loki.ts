#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { Doctor } from '../core/Doctor.js';
import { Runner } from '../core/Runner.js';
import { SetupWizard } from '../core/utils/SetupWizard.js';
import { ProjectManager } from '../core/ProjectManager.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// Load version
const packageJson = fs.readJsonSync(path.join(__dirname, '../../package.json'));
const version = packageJson.version;

program
  .name('loki')
  .description('Loki Mode (Windows Native) - Multi-agent autonomous system')
  .version(version);

program
  .command('doctor')
  .description('Check system prerequisites for Windows')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    const doctor = new Doctor();
    const results = await doctor.checkAll();
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      doctor.displayResults(results);
    }
  });

program
  .command('run')
  .description('Start autonomous Loki Mode RARV cycle')
  .argument('[prd]', 'Path to PRD file')
  .option('--stress-test', 'Execute with maximum council intensity')
  .action(async (prd, options) => {
    const runner = new Runner();
    if (options.stressTest) {
      process.env.LOKI_MAX_ITERATIONS = '20';
      process.env.LOKI_QUALITY_TIER = 'High Assurance';
    }
    await runner.start(prd);
  });

// Keep 'start' as an alias for 'run'
program
  .command('start')
  .description('Alias for "run"')
  .argument('[prd]', 'Path to PRD file')
  .action(async (prd) => {
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
  .description('Initialize a new independent Loki project')
  .argument('<name>', 'Name of the project folder')
  .action(async (name) => {
    const manager = new ProjectManager();
    await manager.initProject(name);
  });

program
  .command('upgrade')
  .description('Upgrade Loki core engine from master source')
  .action(async () => {
    const manager = new ProjectManager();
    await manager.upgrade();
  });

program.parse();
