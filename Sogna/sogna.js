import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const SOGNATORE_PATH = path.join(__dirname, 'Sognatore');
const NODE_MODULES = path.join(SOGNATORE_PATH, 'node_modules');

// Importar directamente desde los entry points de los módulos ESM
import chalk from './Sognatore/node_modules/chalk/source/index.js';
import { program } from './Sognatore/node_modules/commander/esm.mjs';
const fs = require(path.join(SOGNATORE_PATH, 'node_modules', 'fs-extra'));

program
  .name('sogna')
  .description('Sogna Application Forge - Universal Scaffolding and Management')
  .version('1.0.0');

program
  .command('init')
  .description('Scaffold a new Sogna project (Tauri, Supabase, n8n)')
  .argument('<name>', 'Name of the project')
  .action(async (name) => {
    const { execSync } = require('child_process');
    const targetDir = path.join(process.cwd(), name);
    const templatesDir = path.join(SOGNATORE_PATH, 'resources', 'templates');

    console.log(chalk.green(`\n[SOGNA] 🔨 Forjando Fábrica Unicornio: ${name}...`));

    try {
      // 1. Crear Estructura Base
      await fs.ensureDir(targetDir);
      
      // 2. Desplegar Motor Sognatore
      const targetSognaDir = path.join(targetDir, 'Sogna');
      const targetSognatorePath = path.join(targetSognaDir, 'Sognatore');
      
      console.log(chalk.blue(`[SOGNA] ⚙️  Instalando Motor Sognatore Autónomo...`));
      await fs.copy(SOGNATORE_PATH, targetSognatorePath, {
        filter: (src) => !src.includes('node_modules') && !src.includes('.sognatore/state')
      });

      // 3. Desplegar Plantillas (Tauri, Supabase, n8n)
      console.log(chalk.blue(`[SOGNA] 📦 Desplegando infraestructuras (Tauri 2.0, Supabase, n8n)...`));
      
      // Tauri 2.0
      await fs.copy(path.join(templatesDir, 'tauri-v2'), targetDir);
      
      // Supabase
      await fs.copy(path.join(templatesDir, 'supabase'), path.join(targetDir, 'supabase'));

      // n8n
      await fs.copy(path.join(templatesDir, 'n8n'), path.join(targetDir, 'n8n'));

      // 4. Copiar Wrappers y Toolkit a la carpeta Sogna del nuevo proyecto
      await fs.copy(path.join(__dirname, 'sogna.js'), path.join(targetSognaDir, 'sogna.js'));
      await fs.copy(path.join(__dirname, 'sognatore.js'), path.join(targetSognaDir, 'sognatore.js'));
      
      const sourceToolkit = path.join(__dirname, 'toolkit');
      const targetToolkit = path.join(targetSognaDir, 'toolkit');
      console.log(chalk.blue(`[SOGNA] 🛠️  Desplegando Antigravity Toolkit...`));
      await fs.copy(sourceToolkit, targetToolkit);

      // 5. Desplegar Identidad Soberana
      console.log(chalk.blue(`[SOGNA] 🧬 Inyectando Identidad Soberana Sogna...`));
      await fs.copy(path.join(__dirname, 'config', 'sognarules.md'), path.join(targetSognaDir, 'config', 'sognarules.md'));
      await fs.copy(path.join(__dirname, 'config', 'agent-metadata'), path.join(targetSognaDir, 'config', 'agent-metadata'));

      // 6. Crear package.json básico para el frontend si no existe
      const pkgPath = path.join(targetDir, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        const minimalPkg = {
          name: name.toLowerCase(),
          version: "0.1.0",
          private: true,
          dependencies: { "react": "^18.3.1", "react-dom": "^18.3.1" },
          devDependencies: { "vite": "^5.4.1", "@tauri-apps/cli": "2.0.0-rc" },
          scripts: { "dev": "vite", "build": "vite build", "tauri": "tauri" }
        };
        await fs.writeJSON(pkgPath, minimalPkg, { spaces: 2 });
      }

      // 6. Ejecutar Instalación y Compilación (Fábrica Viva)
      console.log(chalk.yellow(`[SOGNA] ⚡ Instalando dependencias (npm install)...`));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

      console.log(chalk.magenta(`[SOGNA] 🦀 Iniciando Vuelo de Tauri (cargo build)...`));
      console.log(chalk.gray(`Nota: Esto puede tardar varios minutos la primera vez.`));
      try {
        execSync('cargo build', { cwd: path.join(targetDir, 'src-tauri'), stdio: 'inherit' });
      } catch (e) {
        console.warn(chalk.yellow(`[SOGNA] ⚠️  Cargo build falló o Rust no está instalado. El proyecto está listo pero requiere compilación manual.`));
      }

      console.log(chalk.green(`\n✔ ¡Fábrica ${name} forjada y lista para el segundo uno!`));
      console.log(chalk.cyan(`\nPróximos pasos:`));
      console.log(`1. cd ${name}`);
      console.log(`2. node Sogna/sognatore.js run   # Despierta a los agentes`);
      
    } catch (err) {
      console.error(chalk.red(`\n✘ Error en la forja: ${err.message}`));
    }
  });

program
  .command('doctor')
  .description('Check health of the Sogna ecosystem')
  .option('--secure', 'Run deep security and vulnerability scan')
  .action(async (options) => {
    const { execSync } = require('child_process');
    console.log(chalk.cyan(`\n[SOGNA] Diagnosticando ecosistema...`));
    
    // Core Checks
    const checkFile = (name, p) => {
      if (fs.existsSync(p)) {
        console.log(chalk.green(`✔ ${name} detectado.`));
        return true;
      } else {
        console.log(chalk.red(`✘ ${name} NO detectado.`));
        return false;
      }
    };

    checkFile('Motor Sognatore', path.join(__dirname, 'Sognatore'));
    checkFile('Toolkit Antigravity', path.join(__dirname, 'toolkit'));
    checkFile('Identidad Soberana', path.join(__dirname, 'config', 'sognarules.md'));
    checkFile('Metadatos de Agente', path.join(__dirname, 'config', 'agent-metadata'));

    if (options.secure) {
      console.log(chalk.magenta(`\n[SENTINEL] 🛡️  Iniciando Auditoría de Seguridad Profunda...`));
      try {
        execSync(`node "${path.join(__dirname, 'sogna.js')}" sentinel sweep`, { stdio: 'inherit' });
        console.log(chalk.green(`\n✔ Diagnóstico Secure completado: Ecosistema Blindado.`));
      } catch (e) {
        console.log(chalk.red(`\n✘ VETO DE SEGURIDAD: Se detectaron vulnerabilidades críticas en el ecosistema.`));
        process.exit(1);
      }
    }
  });

program
  .command('toolkit')
  .description('Manage and explore the Antigravity Toolkit')
  .action(async () => {
    const toolkitPath = path.join(process.cwd(), 'Sogna', 'Toolkit');
    if (!fs.existsSync(toolkitPath)) {
      console.log(chalk.red(`\n✘ No se encontró el Toolkit en Sogna/Toolkit.`));
      return;
    }

    console.log(chalk.magenta(`\n[SOGNA] 🛠️  Explorando Antigravity Toolkit...`));
    
    const categories = ['Agents', 'Rules', 'Workflows', 'Skills', 'Engines'];
    for (const cat of categories) {
      const catPath = path.join(toolkitPath, cat);
      if (fs.existsSync(catPath)) {
        const files = await fs.readdir(catPath);
        console.log(chalk.cyan(`\n🔹 ${cat}:`));
        files.forEach(f => console.log(`  - ${f}`));
      }
    }
  });

program
  .command('predatore')
  .description('Despertar al Sogna Predatore para auditoría ofensiva (Zen Mode)')
  .argument('[command]', 'Comando para Predatore (start, stop, status, logs, workspaces)', 'start')
  .option('-u, --url <url>', 'URL del objetivo a auditar')
  .option('-r, --repo <path>', 'Ruta al repositorio del objetivo')
  .action(async (cmd, options) => {
    const { spawn } = require('child_process');
    const predatorePath = path.join(__dirname, 'toolkit', 'engines', 'predatore');
    const memoryPath = path.join(__dirname, 'memory', 'security');

    console.log(chalk.red(`\n[SOGNA PREDATORE] 🦅 Iniciando incursión ofensiva...`));

    // Asegurar directorio de memoria
    await fs.ensureDir(memoryPath);

    const args = process.argv.slice(3); // Capturar todos los argumentos después de 'predatore'
    
    const child = spawn('node', [path.join(predatorePath, 'predatore'), ...args], {
      cwd: predatorePath,
      stdio: 'inherit',
      env: { ...process.env, PREDATORE_LOCAL: '1', SOGNA_ZEN: 'true' }
    });

    child.on('exit', async (code) => {
      if (code === 0) {
        console.log(chalk.green(`\n✔ Incursión completada con éxito.`));
        // Sincronización de reportes a memoria
        console.log(chalk.blue(`[SOGNA] 📥 Sincronizando hallazgos con Sentinel Memory...`));
        try {
          const workspacesPath = path.join(predatorePath, 'workspaces');
          if (fs.existsSync(workspacesPath)) {
            const sessions = await fs.readdir(workspacesPath);
            for (const session of sessions) {
              const deliverPath = path.join(workspacesPath, session, 'deliverables');
              if (fs.existsSync(deliverPath)) {
                await fs.copy(deliverPath, memoryPath, { overwrite: true });
              }
            }
            console.log(chalk.green(`✔ Hallazgos integrados en Sogna/memory/security.`));
          }
        } catch (err) {
          console.error(chalk.yellow(`⚠️  Error al sincronizar reportes: ${err.message}`));
        }
      } else {
        console.log(chalk.red(`\n✘ Predatore terminó con código de error ${code}.`));
      }
    });
  });

program
  .command('sentinel')
  .description('Despertar a Sogna Sentinel para escudo defensivo (The Tribunal)')
  .argument('[command]', 'Comando defensivo (sweep)', 'sweep')
  .action(async (cmd) => {
    const { execSync } = require('child_process');
    console.log(chalk.blue(`\n[SENTINEL ENGINE] 🛡️  Iniciando protocolo defensivo...`));
    
    if (cmd === 'sweep') {
      console.log(chalk.cyan(`[SWEEP] Iniciando escaneo super-masivo del Monorepo Soberano...`));
      console.log(chalk.gray(`(Buscando inyecciones AST, exposición de secretos, y cadenas de suministro corruptas)`));
      
      try {
        // Obtenemos todos los archivos rastreados por Git en el monorepo
        const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
          .split('\n')
          .filter(f => f && (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('package.json')));
        
        console.log(chalk.gray(`Analizando ${trackedFiles.length} archivos críticos...`));
        
        // Ejecutamos el tribunal sobre la lista de archivos
        execSync(`node toolkit/engines/sentinel/bin/sentinel-veto.js ${trackedFiles.join(' ')}`, { 
          stdio: 'inherit', 
          cwd: process.cwd(), 
          env: process.env 
        });
        
        console.log(chalk.green(`\n✔ [CLEAN] Escaneo exhaustivo completado. El monorepo está blindado.`));
      } catch (err) {
        console.log(chalk.red(`\n✘ [VETO SWEEP INTERVENTION] Se detectaron vulnerabilidades. Sentinel ha registrado el asalto en THREAD_INTEL.md.`));
        process.exit(1);
      }
    }
  });

program.parse();
