#!/usr/bin/env node
import { Color, FS as fs, SognaCLI } from '@Sogna/Curator';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const uma = require('../shared/uma_bridge.cjs');

const SOGNATORE_PATH = path.resolve(__dirname, '../../Sognatore');

const program = new SognaCLI('Sogna')
  .description('Sogna CLI - Global Resource Management and Scaffolding')
  .version('1.0.0');

program.command('init', 'Initialize a new project instance', {
  args: [
    { name: 'name', description: 'Name of the project', required: true }
  ],
  action: async (args) => {
    const name = args.name;
    const targetDir = path.join(process.cwd(), name);
    const templatesDir = path.join(SOGNATORE_PATH, 'resources', 'templates');

    console.log(Color.green(`\n[SOGNA] Initializing project: ${name}...`));

    try {
      if (!fs.existsSync(targetDir)) {
        await fs.mkdir(targetDir, { recursive: true });
      }

      const targetSognaDir = path.join(targetDir, 'Sogna');
      console.log(Color.blue(`[SOGNA] Deploying toolkit and engine components...`));

      const SOGNA_ROOT = path.resolve(__dirname, '../../');
      await fs.copy(SOGNA_ROOT, targetSognaDir, {
        filter: (src) => {
          const relative = path.relative(SOGNA_ROOT, src);
          return !relative.includes('node_modules') &&
            !relative.includes('.git') &&
            !relative.includes('.turbo') &&
            !relative.includes('logs') &&
            !relative.includes('memory/security') &&
            !src.includes('.env');
        }
      });

      console.log(Color.blue(`[SOGNA] Deploying project templates...`));
      await fs.copy(path.join(templatesDir, 'tauri-v2'), targetDir, { overwrite: false });
      await fs.copy(path.join(templatesDir, 'supabase'), path.join(targetDir, 'supabase'), { overwrite: false });
      await fs.copy(path.join(templatesDir, 'n8n'), path.join(targetDir, 'n8n'), { overwrite: false });

      console.log(Color.blue(`[SOGNA] Initializing repository...`));
      try {
        execSync('git init', { cwd: targetDir });
        await fs.copy(path.join(SOGNA_ROOT, '.gitignore'), path.join(targetDir, '.gitignore'));
      } catch (e) {
        console.warn(Color.yellow(`[SOGNA] Warning: Git initialization skipped.`));
      }

      const pkgPath = path.join(targetDir, 'package.json');
      const pkg = {
        name: name.toLowerCase(),
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview",
          "tauri": "tauri"
        },
        dependencies: {
          "@tauri-apps/api": "^2.0.0",
          "framer-motion": "^12.4.7",
          "react": "^19.0.0",
          "react-dom": "^19.0.0"
        },
        devDependencies: {
          "@tauri-apps/cli": "^2.0.0",
          "@types/react": "^19.0.10",
          "@types/react-dom": "^19.0.4",
          "@vitejs/plugin-react": "^4.3.4",
          "typescript": "^5.7.3",
          "vite": "^6.2.0"
        }
      };

      await fs.writeJSON(pkgPath, pkg, { spaces: 2 });

      console.log(Color.yellow(`\n[SOGNA] Installing dependencies (npm install)...`));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

      console.log(Color.green(`\n✔ Project ${name} initialized successfully.`));
      console.log(Color.cyan(`\nNext steps:`));
      console.log(`1. cd ${name}`);
      console.log(`2. Configure local .env file`);
      console.log(`3. Run 'node Sogna/Sognatore/bin/sognatore.js run'`);

    } catch (err: any) {
      console.error(Color.red(`\n✘ Initialization failed: ${err.message}`));
    }
  }
});

program.command('doctor', 'Verify ecosystem health and security status', {
  options: [
    { flags: '--secure', description: 'Run complete security validation' }
  ],
  action: async (args, options) => {
    console.log(Color.cyan(`\n[SOGNA] Running ecosystem diagnostics...`));

    const checkFile = (name: string, p: string) => {
      if (fs.existsSync(p)) {
        console.log(Color.green(`✔ ${name}: OK`));
        return true;
      } else {
        console.log(Color.red(`✘ ${name}: MISSING`));
        return false;
      }
    };

    const SOGNA_ROOT = path.resolve(__dirname, '../../');
    checkFile('Sognatore Engine', path.join(SOGNA_ROOT, 'Sognatore'));
    checkFile('Curator Toolkit', path.join(SOGNA_ROOT, 'Curator'));
    checkFile('Operational Rules', path.join(SOGNA_ROOT, 'memory', 'identity', 'rules.md'));

    if (options.secure) {
      console.log(Color.magenta(`\n[SECURITY] Running validation protocol...`));
      try {
        execSync(`node "${path.join(__dirname, 'sogna.js')}" sentinel sweep`, { stdio: 'inherit' });
      } catch (e) {
        console.error(Color.red(`\n✘ Security validation failed.`));
        process.exit(1);
      }
    }
  }
});

program.command('list', 'Audit system assets: Agents, Capabilities, and Operations', {
  action: async () => {
    console.log(Color.magenta(`\n[AUDIT] Discovering assets...`));

    // Catalog logic
    const catalogPath = path.join(SOGNATORE_PATH, 'resources', 'config', 'agent_group_catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = await fs.readJSON(catalogPath);
      console.log(Color.cyan(`\nAgents:`));
      Object.keys(catalog.agent_groups).forEach(s => {
        console.log(` [${s}] -> ${catalog.agent_groups[s].agents.join(', ')}`);
      });
    }

    const skillsPath = path.join(SOGNATORE_PATH, 'resources', 'skills');
    if (fs.existsSync(skillsPath)) {
      console.log(Color.cyan(`\nCapabilities (Skills):`));
      const domains = ['engineering', 'data_ai', 'business_product', 'operations_security', 'utilities'];
      let count = 0;
      for (const domain of domains) {
        const domainPath = path.join(skillsPath, domain);
        if (fs.existsSync(domainPath)) {
          const skills = (await fs.readdir(domainPath)).filter(f => fs.statSync(path.join(domainPath, f)).isDirectory());
          count += skills.length;
        }
      }
      console.log(Color.gray(` - Detected ${count} operational skills.`));
    }
  }
});

program.command('sentinel', 'Execute security and validation operations', {
  args: [
    { name: 'cmd', description: 'Command: sweep, train, status', required: true }
  ],
  action: async (args) => {
    const cmd = args.cmd;
    console.log(Color.blue(`\n[SECURITY] Initializing validation engine...`));

    if (cmd === 'sweep') {
      try {
        const vetoPath = path.join(__dirname, '..', '..', 'Sentinel', 'bin', 'sentinel-veto.js');
        execSync(`node "${vetoPath}" --all --fix`, { stdio: 'inherit' });
        console.log(Color.green(`\n✔ Security sweep completed.`));
      } catch (err) {
        console.error(Color.red(`\n✘ Security sweep detected critical issues.`));
        process.exit(1);
      }
    } else if (cmd === 'status') {
      const dnaPath = path.join(__dirname, '..', '..', 'Sentinel', 'data', 'risk_dna_feed.json');
      if (fs.existsSync(dnaPath)) {
        const status = await fs.readJSON(dnaPath);
        console.log(Color.cyan(`\n[STATUS] Security Metadata:`));
        console.log(` - Last Scan: ${status.timestamp}`);
        console.log(` - Risk Entities: ${status.stats?.total_scanned || 'N/A'}`);
      }
    }
  }
});

program.parse();
