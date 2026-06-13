#!/usr/bin/env node
import { FS as fs, SognaCLI } from '@Sogna/Curator';
import { EnvOracle } from '../core/utils/EnvOracle.js';
EnvOracle.load();

import { Doctor } from '../core/Doctor.js';
import { Runner } from '../core/Runner.js';
import { Engine as PolicyEngine } from '../Sentinel-Sognatore/Engine.js';
import { SetupWizard } from '../core/utils/SetupWizard.js';
import { ProjectManager } from '../core/ProjectManager.js';
import { BootstrapEngine } from '../core/BootstrapEngine.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const program = new SognaCLI('Sognatore')
  .description('Sognatore (Windows Native) - Multi-agent autonomous system')
  .version(version);

program.command('doctor', 'Check system prerequisites for Windows', {
  options: [
    { flags: '--json', description: 'Output results as JSON' },
    { flags: '--fix', description: 'Automatically repair fixable issues' }
  ],
  action: async (args, options) => {
    const doctor = new Doctor();
    const results = await doctor.checkAll();
    
    if (options.fix) {
      await doctor.heal(results);
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
  }
});

program.command('run', 'Start autonomous Sognatore RARV Cycle', {
  args: [
    { name: 'prd', description: 'Path to PRD file', required: false }
  ],
  options: [
    { flags: '--stress-test', description: 'Execute with maximum council intensity' },
    { flags: '--mode', description: 'Permission mode (readonly|balanced|full)', defaultValue: 'balanced' }
  ],
  action: async (args, options) => {
    PolicyEngine.setGlobalMode(options.mode);
    const runner = new Runner();
    if (options.stressTest) {
      process.env.SOGNATORE_MAX_ITERATIONS = '20';
      process.env.SOGNATORE_QUALITY_TIER = 'High Assurance';
    }

    const bootstrap = BootstrapEngine.getInstance();
    const ready = await bootstrap.run();
    
    if (!ready) {
      process.exit(1);
    }

    const { ImmuneSystem } = await import('../core/ImmuneSystem.js');
    await ImmuneSystem.start();

    await runner.start(args.prd);

    try {
      const { TelemetryServer } = await import('../observability/TelemetryServer.js');
      const { MemoryConsolidator } = await import('../core/memory-consolidator.js');
      const { Orchestrator } = await import('../core/Orchestrator.js');
      const { LspBridge } = await import('../core/LspBridge.js');
      const policies = await import('../policies/index.js');

      TelemetryServer.getInstance().stop();
      MemoryConsolidator.getInstance().stop();
      Orchestrator.getInstance().stopAll();
      LspBridge.getInstance().stopAll();
      policies.destroy();
      console.log('👋 Sognatore exited cleanly.');
    } catch (e) {
      // Ignored during shutdown
    }
  }
});

// Start is an alias for run
program.command('start', 'Alias for "run"', {
  args: [
    { name: 'prd', description: 'Path to PRD file', required: false }
  ],
  options: [
    { flags: '--mode', description: 'Permission mode (readonly|balanced|full)', defaultValue: 'balanced' }
  ],
  action: async (args, options) => {
    PolicyEngine.setGlobalMode(options.mode);
    const runner = new Runner();
    await runner.start(args.prd);

    try {
      const { TelemetryServer } = await import('../observability/TelemetryServer.js');
      const { MemoryConsolidator } = await import('../core/memory-consolidator.js');
      const { Orchestrator } = await import('../core/Orchestrator.js');
      const { LspBridge } = await import('../core/LspBridge.js');
      const policies = await import('../policies/index.js');

      TelemetryServer.getInstance().stop();
      MemoryConsolidator.getInstance().stop();
      Orchestrator.getInstance().stopAll();
      LspBridge.getInstance().stopAll();
      policies.destroy();
      console.log('👋 Sognatore exited cleanly.');
    } catch (e) {
      // Ignored during shutdown
    }
  }
});

program.command('setup', 'Configure API keys and project environment', {
  action: async () => {
    const wizard = new SetupWizard();
    await wizard.run();
  }
});

program.command('init', 'Initialize a new Sognatore project', {
  args: [
    { name: 'name', description: 'Name of the project folder', required: true }
  ],
  action: async (args) => {
    const manager = new ProjectManager();
    await manager.initProject(args.name);
  }
});

program.command('upgrade', 'Upgrade Sognatore core engine from source', {
  action: async () => {
    const manager = new ProjectManager();
    await manager.upgrade();
  }
});

program.parse();
