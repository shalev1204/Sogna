import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const SOGNATORE_PATH = path.join(__dirname, '..', '..', 'Sognatore');
const NODE_MODULES = path.join(SOGNATORE_PATH, 'node_modules');

// Importar directamente desde los entry points de los módulos ESM
import chalk from '../../Sognatore/node_modules/chalk/source/index.js';
import { program } from '../../Sognatore/node_modules/commander/esm.mjs';
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

    console.log(chalk.green(`\n[SOGNA FORGE] 🔨 Forjando Nueva Instancia Soberana: ${name}...`));

    try {
      // 1. Crear Estructura Base y Limpieza
      if (fs.existsSync(targetDir)) {
        console.log(chalk.yellow(`[SOGNA] ⚠️  El directorio ya existe. Usando estructura existente...`));
      } else {
        await fs.ensureDir(targetDir);
      }
      
      // 2. Desplegar Núcleo Sogna (El ADN)
      const targetSognaDir = path.join(targetDir, 'Sogna');
      console.log(chalk.blue(`[SOGNA] 🧬 Inyectando ADN Soberano (Toolkit, Engines, Config)...`));
      
      // Copiar TODO el contenido de la carpeta Sogna actual al destino
      // Excluimos node_modules, .git y archivos de estado temporal
      const SOGNA_ROOT = path.join(__dirname, '..', '..');
      await fs.copy(SOGNA_ROOT, targetSognaDir, {
        filter: (src) => {
          const relative = path.relative(SOGNA_ROOT, src);
          return !relative.includes('node_modules') && 
                 !relative.includes('.git') && 
                 !relative.includes('.turbo') &&
                 !relative.includes('logs') &&
                 !relative.includes('memory/security') &&
                 !src.includes('.env'); // Importante: No clonamos las API Keys
        }
      });

      // 3. Desplegar Infraestructura del Producto
      console.log(chalk.blue(`[SOGNA] 📦 Desplegando infraestructuras base (Tauri 2.0, Supabase, n8n)...`));
      
      // Tauri 2.0 (Product Core)
      await fs.copy(path.join(templatesDir, 'tauri-v2'), targetDir, { overwrite: false });
      
      // Supabase & n8n
      await fs.copy(path.join(templatesDir, 'supabase'), path.join(targetDir, 'supabase'), { overwrite: false });
      await fs.copy(path.join(templatesDir, 'n8n'), path.join(targetDir, 'n8n'), { overwrite: false });

      // 4. Inicializar Repositorio Local (Independencia)
      console.log(chalk.blue(`[SOGNA] 🏁 Inicializando Repositorio Git Independiente...`));
      try {
        execSync('git init', { cwd: targetDir });
        // Asegurar que el .gitignore esté en la raíz del nuevo proyecto
        await fs.copy(path.join(__dirname, '..', '..', '.gitignore'), path.join(targetDir, '.gitignore'));
      } catch (e) {
        console.warn(chalk.yellow(`[SOGNA] ⚠️  No se pudo inicializar git. Asegúrate de tenerlo instalado.`));
      }

      // 5. Configuración de Identidad (package.json)
      const pkgPath = path.join(targetDir, 'package.json');
      let pkg = {
        name: name.toLowerCase(),
        version: "1.0.0-sovereign",
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

      // 6. Instalación de Dependencias
      console.log(chalk.yellow(`\n[SOGNA] ⚡ Instalando dependencias en la nueva instancia (npm install)...`));
      console.log(chalk.gray(`Esto puede tardar un momento...`));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

      // 7. Bienvenida y Asistente de Claves (Placeholder para Task 2)
      console.log(chalk.green(`\n✔ ¡La instancia ${name} ha nacido con éxito!`));
      console.log(chalk.cyan(`\n🚀 ¡BIENVENIDO AL SEGUNDO UNO!`));
      console.log(chalk.white(`Tu nuevo proyecto es totalmente autónomo y tiene su propio aprendizaje.`));
      
      console.log(chalk.magenta(`\n🚨 PRÓXIMO PASO CRÍTICO:`));
      console.log(chalk.white(`1. Entra en el directorio: `) + chalk.bold(`cd ${name}`));
      console.log(chalk.white(`2. Configura tus API Keys locales (Manus, Perplexity, etc.) en el archivo .env`));
      console.log(chalk.white(`3. Despierta a los agentes: `) + chalk.bold(`node Sogna/sognatore.js run`));
      
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

    const SOGNA_ROOT_CHECK = path.join(__dirname, '..', '..');
    checkFile('Motor Sognatore', path.join(SOGNA_ROOT_CHECK, 'Sognatore'));
    checkFile('Toolkit Antigravity', path.join(SOGNA_ROOT_CHECK, 'toolkit'));
    checkFile('Identidad Soberana', path.join(SOGNA_ROOT_CHECK, 'config', 'sognarules.md'));
    checkFile('Metadatos de Agente', path.join(SOGNA_ROOT_CHECK, 'config', 'agent-metadata'));

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
    const predatorePath = path.join(__dirname, '..', 'engines', 'predatore');
    const memoryPath = path.join(__dirname, '..', '..', 'memory', 'security');

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
        const allTracked = execSync('git ls-files', { encoding: 'utf8' })
          .split('\n')
          .filter(f => f && (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('package.json')));
        
        console.log(chalk.gray(`Analizando ${allTracked.length} archivos críticos en lotes...`));
        
        // Chunking para evitar errores de longitud de comando en Windows (Límite ~8191 caracteres)
        const CHUNK_SIZE = 40; 
        for (let i = 0; i < allTracked.length; i += CHUNK_SIZE) {
          const chunk = allTracked.slice(i, i + CHUNK_SIZE);
          const batchNum = Math.floor(i / CHUNK_SIZE) + 1;
          const totalBatches = Math.ceil(allTracked.length / CHUNK_SIZE);
          
          process.stdout.write(chalk.gray(`  [Batch ${batchNum}/${totalBatches}] Procesando... `));
          
          try {
            execSync(`node toolkit/engines/sentinel/bin/sentinel-veto.js ${chunk.join(' ')}`, { 
              stdio: ['ignore', 'ignore', 'pipe'], // Ignoramos stdout/stdin, capturamos stderr
              cwd: process.cwd(), 
              env: process.env 
            });
            process.stdout.write(chalk.green(`OK\n`));
          } catch (err) {
            process.stdout.write(chalk.red(`VETO\n`));
            // Si el error contiene el reporte de Sentinel, lo mostramos
            const stderr = err.stderr ? err.stderr.toString() : '';
            if (stderr.includes('SENTINEL')) {
               console.error(stderr);
            } else {
               console.error(chalk.red(`Error en lote ${batchNum}: ${err.message}`));
            }
            // En caso de error crítico, nos detenemos si Sentinel así lo indica (exit code 1)
            if (err.status === 1) {
              console.log(chalk.red(`\n✘ [VETO SWEEP INTERVENTION] Se detectaron vulnerabilidades críticas. Abortando.`));
              process.exit(1);
            }
          }
        }
        
        console.log(chalk.green(`\n✔ [CLEAN] Escaneo exhaustivo completado. El monorepo está blindado.`));
      } catch (err) {
        console.log(chalk.red(`\n✘ [SWEEP ERROR] No se pudo completar el escaneo: ${err.message}`));
        process.exit(1);
      }
    }

  });

program.parse();
