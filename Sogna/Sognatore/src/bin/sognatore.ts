#!/usr/bin/env node
import { FS as fs, SognaCLI, Color } from '@Sogna/Curator';
import { EnvOracle } from '../core/utils/EnvOracle.js';
EnvOracle.load();

import { Doctor } from '../core/Doctor.js';
import { Runner } from '../core/Runner.js';
import { Engine as PolicyEngine } from '../Sentinel-Sognatore/Engine.js';
import { SetupWizard } from '../core/utils/SetupWizard.js';
import { ProjectManager } from '../core/ProjectManager.js';
import { BootstrapEngine } from '../core/BootstrapEngine.js';
import {
  runDispatch,
  runWorkerEnqueue,
  runWorkerStatus,
  runWorkerList,
  listScriptActions,
} from '../core/cli/DispatchService.js';

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

program.command('dispatch', 'Delegar tarea: brief de agente, routing o script local (sin API cloud)', {
  options: [
    { flags: '--agent', description: 'Id agente Curator (ej. review-security)' },
    { flags: '--dept', description: 'Departamento (protection, infrastructure, ...)' },
    { flags: '--action', description: 'Script whitelist (sentinel-audit, mcp-clients, ...)' },
    { flags: '--task', description: 'Descripción de tarea para enrutamiento' },
    { flags: '--query', description: 'Consulta UMA + brief' },
    { flags: '--json', description: 'Salida JSON' },
    { flags: '--wait', description: 'Esperar fin del job script' },
  ],
  action: async (_args, options) => {
    try {
      const out = await runDispatch({
        agent: options.agent,
        dept: options.dept,
        action: options.action,
        task: options.task,
        query: options.query,
        json: !!options.json,
        wait: !!options.wait,
      });
      console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    } catch (e) {
      console.error(Color.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }
  },
});

program.command('worker-enqueue', 'Encolar trabajo en worker local (Ollama o script)', {
  options: [
    { flags: '--kind', description: 'script | ollama', defaultValue: 'script' },
    { flags: '--action', description: 'Id script si kind=script' },
    { flags: '--task', description: 'Prompt si kind=ollama' },
    { flags: '--tier', description: 'T3|T4|T5 informativo' },
    { flags: '--json', description: 'Salida JSON' },
    { flags: '--wait', description: 'Esperar finalización' },
  ],
  action: async (_args, options) => {
    try {
      const kind = options.kind === 'ollama' ? 'ollama' : 'script';
      const out = await runWorkerEnqueue({
        kind,
        action: options.action,
        task: options.task,
        tier: options.tier,
        json: !!options.json,
        wait: !!options.wait,
      });
      console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    } catch (e) {
      console.error(Color.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }
  },
});

program.command('worker-status', 'Estado de un job del worker local', {
  args: [{ name: 'jobId', description: 'UUID del job', required: true }],
  options: [{ flags: '--json', description: 'Salida JSON' }],
  action: async (args, options) => {
    try {
      const out = await runWorkerStatus(args.jobId, !!options.json);
      console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    } catch (e) {
      console.error(Color.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }
  },
});

program.command('worker-list', 'Listar jobs del worker local', {
  options: [{ flags: '--json', description: 'Salida JSON' }],
  action: async (_args, options) => {
    const out = await runWorkerList(!!options.json);
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
  },
});

program.command('worker-scripts', 'Listar acciones script permitidas', {
  action: async () => {
    const actions = await listScriptActions();
    console.log(actions.join('\n'));
  },
});

program.parse();
