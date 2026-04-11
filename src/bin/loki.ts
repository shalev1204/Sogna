#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { Doctor } from '../core/Doctor.js';
import { Runner } from '../core/Runner.js';
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
  .command('start')
  .description('Start Loki Mode (Basic Mode)')
  .argument('[prd]', 'Path to PRD file')
  .option('--provider <name>', 'AI provider (claude, gemini, etc.)', 'claude')
  .action(async (prd, options) => {
    const runner = new Runner();
    await runner.start(prd, options.provider);
  });

program.parse();
