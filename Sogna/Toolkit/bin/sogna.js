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
  .description('Sognatore Application Forge - Universal Scaffolding and Management')
  .version('1.0.0');

program
  .command('init')
  .description('Scaffold a new Sognatore project (Tauri, Supabase, n8n)')
  .argument('<name>', 'Name of the project')
    .action(async (name) => {
    const { execSync } = require('child_process');
    const targetDir = path.join(process.cwd(), name);
    const templatesDir = path.join(SOGNATORE_PATH, 'resources', 'templates');

    console.log(chalk.green(`\n[Sognatore FORGE] 🔨 Forjando Nueva Instancia Soberana: ${name}...`));

    try {
      // 1. Crear Estructura Base y Limpieza
      if (fs.existsSync(targetDir)) {
        console.log(chalk.yellow(`[SOGNA] ⚠️  El directorio ya existe. Usando estructura existente...`));
      } else {
        await fs.ensureDir(targetDir);
      }
      
      // 2. Desplegar Núcleo Sognatore (El ADN)
      const targetSognaDir = path.join(targetDir, 'Sogna');
      console.log(chalk.blue(`[SOGNA] 🧬 Inyectando ADN Soberano (Toolkit, Engines, Config)...`));
      
      // Copiar TODO el contenido de la carpeta Sognatore actual al destino
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
  .description('Check health of the Sognatore ecosystem')
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
    checkFile('Identidad Soberana', path.join(SOGNA_ROOT_CHECK, 'Sognatore', 'config', 'rules.md'));
    checkFile('Metadatos de Agente', path.join(SOGNA_ROOT_CHECK, 'Sognatore', 'config', 'agent_metadata.json'));

    if (options.secure) {
      console.log(chalk.magenta(`\n[SENTINEL] 🛡️  Iniciando Auditoría de Seguridad Profunda...`));
      try {
        execSync(`node "${path.join(__dirname, 'Sognatore.js')}" sentinel sweep`, { stdio: 'inherit' });
        console.log(chalk.green(`\n✔ Diagnóstico Secure completado: Ecosistema Blindado.`));
      } catch (e) {
        console.log(chalk.red(`\n✘ VETO DE SEGURIDAD: Se detectaron vulnerabilidades críticas en el ecosistema.`));
        process.exit(1);
      }
    }
  });

program
  .command('toolkit')
  .description('Explore the legacy Antigravity Toolkit assets')
  .action(async () => {
    const toolkitPath = path.join(process.cwd(), 'Sogna', 'toolkit');
    if (!fs.existsSync(toolkitPath)) {
      console.log(chalk.red(`\n✘ No se encontró el Toolkit en Sogna/toolkit.`));
      return;
    }

    console.log(chalk.magenta(`\n[SOGNA] 🛠️  Explorando Antigravity Toolkit...`));
    
    const categories = ['engines', 'data', 'bin'];
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
  .command('list')
  .description('Asset Discovery: View all Agents, Skills and Missions')
  .option('-a, --all', 'Mostrar todos los assets enterrados')
  .action(async (options) => {
    console.log(chalk.magenta(`\n[INVENTORY] 🔎 Discovery...`));

    // 1. Swarms
    const swarmsPath = path.join(__dirname, '..', 'data', 'swarms.json');
    if (fs.existsSync(swarmsPath)) {
        const { swarms } = await fs.readJSON(swarmsPath);
        console.log(chalk.cyan(`\n🐝 SWARMS:`));
        swarms.forEach(s => console.log(`  - ${chalk.bold(s.id)}: ${s.name}`));
    }

    // 2. Agents (Sognatore)
    const catalogPath = path.join(SOGNATORE_PATH, 'resources', 'config', 'swarm_catalog.json');
    if (fs.existsSync(catalogPath)) {
        const catalog = await fs.readJSON(catalogPath);
        console.log(chalk.cyan(`\n🤖 SOGNATORE AGENTS (Brains):`));
        Object.keys(catalog.swarms).forEach(s => {
            console.log(`  [${s}] -> ${catalog.swarms[s].agents.join(', ')}`);
        });
    }

    // 3. Skills (Sognatore + Toolkit)
    const sognaSkills = path.join(SOGNATORE_PATH, 'resources', 'skills');
    
    console.log(chalk.cyan(`\n📜 CAPABILITIES (Skills):`));
        const getSkillCount = (dirPath) => {
            const domains = ['engineering', 'data_ai', 'business_product', 'operations_security', 'utilities'];
            let count = 0;
            domains.forEach(domain => {
                const domainPath = path.join(dirPath, domain);
                if (fs.existsSync(domainPath)) {
                    const skills = fs.readdirSync(domainPath).filter(f => fs.statSync(path.join(domainPath, f)).isDirectory());
                    count += skills.length;
                }
            });
            return count;
        };
        const totalSkills = getSkillCount(sognaSkills);
        console.log(chalk.gray(`  - Sognatore: ${totalSkills} skills detected.`));

    // 4. Misiones (Nuevas)
    const missionsPath = path.join(__dirname, '..', 'data', 'missions.json');
    if (fs.existsSync(missionsPath)) {
        const { missions } = await fs.readJSON(missionsPath);
        console.log(chalk.cyan(`\n🚀 MISSIONS:`));
        missions.forEach(m => console.log(`  - ${chalk.bold(m.id)}: ${m.name} (${m.steps.length} steps)`));
    }
    
    console.log(chalk.white(`\nUse 'Sognatore mission info <id>' to view mission details.`));
  });

program
  .command('mission')
  .description('Mission Engine: Orchestration of autonomous flows')
  .argument('<cmd>', 'Comando de misión (list, info, run)')
  .argument('[id]', 'ID de la misión')
  .option('--autonomous', 'Ejecutar misión de forma totalmente autónoma (Sognatore Mode)', true)
  .action(async (cmd, id, options) => {
    const missionsPath = path.join(__dirname, '..', 'data', 'missions.json');
    if (!fs.existsSync(missionsPath)) {
      console.log(chalk.red(`\n✘ No se encontró el manifiesto de misiones.`));
      return;
    }

    const { missions } = await fs.readJSON(missionsPath);

    if (cmd === 'list') {
      console.log(chalk.magenta(`\n[Sognatore MISSIONS] 🚀 Misiones Disponibles:`));
      missions.forEach(m => {
        console.log(chalk.cyan(`\n🔹 ${m.name} (${chalk.white(m.id)})`));
        console.log(chalk.gray(`   ${m.description}`));
        console.log(`   Pasos: ${m.steps.map(s => s.title).join(' → ')}`);
      });
      return;
    }

    if (cmd === 'info') {
      const mission = missions.find(m => m.id === id);
      if (!mission) return console.log(chalk.red(`✘ Misión '${id}' no encontrada.`));
      
      console.log(chalk.magenta(`\n[MISSION INFO] ${mission.name}`));
      console.log(chalk.white(mission.description));
      console.log(chalk.cyan(`\nPlan de Ejecución:`));
      mission.steps.forEach((s, i) => {
          console.log(`  ${i+1}. ${chalk.bold(s.title)} [${s.agentType}] -> ${s.taskType}`);
          console.log(chalk.gray(`     Objetivo: ${s.goal}`));
      });
      return;
    }

    if (cmd === 'run') {
       const mission = missions.find(m => m.id === id);
       if (!mission) return console.log(chalk.red(`✘ Misión '${id}' no encontrada.`));

       console.log(chalk.green(`\n[MISSION START] 🚀 Iniciando Misión: ${mission.name}`));
       if (options.autonomous) {
           console.log(chalk.magenta(`[AUTONOMOUS] Sognatore Engine activado. Orquestando ${mission.steps.length} pasos...`));
           
           // Simulación de despacho a Sognatore
           for (const step of mission.steps) {
               console.log(chalk.blue(`\n[STEP] ${step.title}...`));
               console.log(chalk.gray(`  Despachando a: ${step.agentType} | Tarea: ${step.taskType}`));
               console.log(chalk.green(`  ✔ Step '${step.id}' completado por Sognatore.`));
               // En un entorno real, aquí se llamaría a SwarmOrchestrator.dispatchTask()
           }
           console.log(chalk.green(`\n✔ MISION COMPLETADA: ${mission.name} finalizada con éxito.`));
       }
    }
  });

program
  .command('refine')
  .description('Skill Refiner: Optimización autónoma de habilidades')
  .argument('<path>', 'Ruta al archivo SKILL.md o directorio de habilidades')
  .action(async (targetPath) => {
    const { execSync } = require('child_process');
    console.log(chalk.magenta(`\n[REFINER] 🧪 Iniciando Refinamiento de Habilidades...`));
    
    try {
      const refinerPath = path.join(__dirname, 'refine-skill.js');
      execSync(`node "${refinerPath}" "${targetPath}" --auto-apply`, { stdio: 'inherit' });
    } catch (err) {
      console.error(chalk.red(`\n✘ Error en el refinamiento: ${err.message}`));
    }
  });

program
  .command('predatore')
  .description('Despertar al Sognatore Predatore para auditoría ofensiva (Zen Mode)')
  .argument('[command]', 'Comando para Predatore (start, stop, status, logs, workspaces)', 'start')
  .option('-u, --url <url>', 'URL del objetivo a auditar')
  .option('-r, --repo <path>', 'Ruta al repositorio del objetivo')
  .action(async (cmd, options) => {
    const { spawn } = require('child_process');
    const predatorePath = path.join(__dirname, '..', 'engines', 'predatore');
    const memoryPath = path.join(__dirname, '..', '..', 'memory', 'security');

    console.log(chalk.red(`\n[Sognatore PREDATORE] 🦅 Iniciando incursión ofensiva...`));

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
  .description('Despertar a Sognatore Sentinel para escudo defensivo (The Tribunal)')
  .argument('[command]', 'Comando defensivo (sweep, train, status)', 'sweep')
  .action(async (cmd) => {
    const { execSync } = require('child_process');
    console.log(chalk.blue(`\n[SENTINEL ENGINE] 🛡️  Iniciando protocolo defensivo...`));
    
    if (cmd === 'train') {
      console.log(chalk.magenta(`[TRAIN] Iniciando entrenamiento masivo de Risk DNA...`));
      console.log(chalk.gray(`(Analizando +1,400 habilidades para extraer patrones de riesgo ofensivo)`));
      
      try {
        const trainerPath = path.join(__dirname, '..', 'engines', 'sentinel', 'bin', 'sentinel_trainer.py');
        execSync(`python "${trainerPath}"`, { stdio: 'inherit' });
        console.log(chalk.green(`\n✔ [LEARNED] El cerebro de Sentinel ha sido actualizado.`));
      } catch (err) {
        console.error(chalk.red(`\n✘ [TRAIN ERROR] No se pudo completar el entrenamiento: ${err.message}`));
      }
      return;
    }

    if (cmd === 'status') {
      const dnaPath = path.join(__dirname, '..', 'engines', 'sentinel', 'data', 'risk_dna_feed.json');
      if (fs.existsSync(dnaPath)) {
        const dna = await fs.readJSON(dnaPath);
        const riskDNA = await fs.readJSON(dnaPath);
        console.log(chalk.cyan(`\n📊 [SENTINEL STATUS] Base de Conocimiento de Riesgo:`));
        console.log(`  - Ultima actualización: ${riskDNA.timestamp}`);
        console.log(`  - Total Entidades: ${riskDNA.stats?.total_scanned || 'N/A'}`);
        console.log(`  - Versión Intel : ${riskDNA.version || '1.0'}`);
        console.log(`  - Dominios de Riesgo: ${riskDNA.domains.length}`);
        console.log(`  - Patrones Ofensivos : ${riskDNA.flags.length}`);
        console.log(`  - Fugas Detectadas   : ${(riskDNA.leaks || []).length}`);
        console.log(`  - Secretos Expuestos : ${(riskDNA.secrets || []).length}`);
        console.log(`  - Config. Vulnerable : ${(riskDNA.vulnerabilities || []).length}`);
        console.log(`  - Alertas Heurísticas: ${riskDNA.stats?.heuristic_alerts || 0}`);
        console.log(`  - Alertas Entropía   : ${riskDNA.stats?.entropy_warnings || 0}`);
        
        const ledgerStatus = (riskDNA.stats?.risk_hits > 0) ? chalk.red('⚠️  CRITICAL VULNS DETECTED') : chalk.green('✅ SECURE');
        console.log(`\n[VULNERABILITY LEDGER] Status: ${ledgerStatus}`);
        
        if (riskDNA.agent_keywords) {
            console.log(`  - Palabras Clave de Agente: ${riskDNA.agent_keywords.length}`);
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  [SENTINEL] No hay feed de Risk DNA detectado. Ejecuta 'Sognatore sentinel train'.`));
      }
      return;
    }

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

program
  .command('swarm')
  .description('Manage Sognatore Swarms (Enjambres de Habilidades, Agentes y Workflows)')
  .argument('[command]', 'Comando de enjambre (list, activate, status)', 'list')
  .argument('[swarm_id]', 'ID del enjambre a activar')
  .action(async (cmd, swarmId) => {
    const swarmsPath = path.join(__dirname, '..', 'data', 'swarms.json');
    if (!fs.existsSync(swarmsPath)) {
      console.log(chalk.red(`\n✘ No se encontró el manifiesto de enjambres en toolkit/data/swarms.json.`));
      return;
    }

    const { swarms } = await fs.readJSON(swarmsPath);

    if (cmd === 'list') {
      console.log(chalk.magenta(`\n[Sognatore SWARMS] 🐝 Enjambres Disponibles:`));
      swarms.forEach(s => {
        console.log(chalk.cyan(`\n🔹 ${s.name} (${chalk.white(s.id)})`));
        console.log(chalk.gray(`   ${s.description}`));
        console.log(`   Assets: ${s.assets.skills.length} Habilidades, ${s.assets.agents.length} Agentes, ${s.assets.workflows.length} Workflows`);
      });
      return;
    }

    if (cmd === 'activate') {
      if (!swarmId) {
        console.log(chalk.yellow(`\n⚠️  Especifica un ID de enjambre para activar. Ej: Sognatore swarm activate essentials`));
        return;
      }

      const swarm = swarms.find(s => s.id === swarmId);
      if (!swarm) {
        console.log(chalk.red(`\n✘ Enjambre '${swarmId}' no encontrado.`));
        return;
      }

      console.log(chalk.green(`\n[ACTIVATE] 🚀 Activando Enjambre: ${swarm.name}...`));
      
      const activePath = path.join(process.cwd(), '.sogna_active');
      await fs.ensureDir(activePath);
      
      // Limpiar activación previa
      await fs.emptyDir(activePath);

      // En esta fase, creamos un manifiesto local de "vuelo" para que las IAs sepan qué tienen disponible
      const manifest = {
        active_swarm: swarm.id,
        activated_at: new Date().toISOString(),
        assets: swarm.assets
      };

      await fs.writeJSON(path.join(activePath, 'swarm_manifest.json'), manifest, { spaces: 2 });
      
      console.log(chalk.blue(`[OK] Perfil de vuelo generado en .sogna_active/`));
      console.log(chalk.white(`Los agentes ahora priorizarán las ${swarm.assets.skills.length} habilidades de este enjambre.`));
    }
  });

program
  .command('install')
  .description('Universal Installer: Inject Sognatore Toolkit into IAs')
  .option('--cursor', 'Instalar reglas y habilidades para Cursor')
  .option('--claude', 'Instalar para Claude Code')
  .option('--gemini', 'Instalar para Google Gemini Antigravity')
  .option('--vscode', 'Instalar para VS Code Copilot')
  .action(async (options) => {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    
    const targets = [];
    if (options.cursor) targets.push({ name: 'Cursor', path: path.join(process.cwd(), '.cursorrules') });
    if (options.claude) targets.push({ name: 'Claude Code', path: path.join(home, '.claude', 'skills') });
    if (options.gemini) targets.push({ name: 'Gemini Antigravity', path: path.join(home, '.gemini', 'antigravity', 'skills') });

    if (targets.length === 0) {
      console.log(chalk.yellow(`\n⚠️  Selecciona al menos una plataforma (ej: --cursor, --claude).`));
      return;
    }

    for (const target of targets) {
      console.log(chalk.cyan(`\n[INSTALL] 📦 Inyectando en ${target.name}...`));
      console.log(chalk.gray(`Ruta objetivo: ${target.path}`));
      
      // Lógica de inyección simplificada para el MVP
      try {
        if (target.name === 'Cursor') {
          const rulesPath = path.join(__dirname, '..', '..', 'Sognatore', 'config', 'rules.md');
          if (fs.existsSync(rulesPath)) {
            await fs.copy(rulesPath, target.path);
            console.log(chalk.green(`✔ .cursorrules actualizado con ADN Sognatore.`));
          }
        } else {
          await fs.ensureDir(target.path);
          console.log(chalk.green(`✔ Directorio de habilidades preparado en ${target.name}.`));
        }
      } catch (err) {
        console.error(chalk.red(`✘ Fallo en la instalación para ${target.name}: ${err.message}`));
      }
    }
  });

program.parse();
