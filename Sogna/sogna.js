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
  .action(() => {
    console.log(chalk.cyan(`\n[SOGNA] Diagnosticando ecosistema...`));
    const sognatorePath = path.join(process.cwd(), 'Sogna', 'Sognatore');
    if (fs.existsSync(sognatorePath)) {
      console.log(chalk.green(`✔ Motor Sognatore detectado.`));
    } else {
      console.log(chalk.red(`✘ Motor Sognatore NO detectado en Sogna/Sognatore.`));
    }

    const toolkitPath = path.join(process.cwd(), 'Sogna', 'Toolkit');
    if (fs.existsSync(toolkitPath)) {
      console.log(chalk.green(`✔ Toolkit Antigravity detectado.`));
    } else {
      console.log(chalk.red(`✘ Toolkit Antigravity NO detectado.`));
    }

    // Sovereign Identity Check
    const sognarulesPath = path.join(process.cwd(), 'Sogna', 'config', 'sognarules.md');
    if (fs.existsSync(sognarulesPath)) {
      console.log(chalk.green(`✔ Identidad Soberana (sognarules.md) detectada.`));
    } else {
      console.log(chalk.yellow(`⚠️  Identidad Soberana (sognarules.md) no encontrada.`));
    }

    const metadataPath = path.join(process.cwd(), 'Sogna', 'config', 'agent-metadata');
    if (fs.existsSync(metadataPath)) {
      console.log(chalk.green(`✔ Metadatos de Agente (agent-metadata) detectados.`));
    } else {
      console.log(chalk.yellow(`⚠️  Carpeta de Metadatos (agent-metadata) no encontrada.`));
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
    
    const categories = ['Agents', 'Rules', 'Workflows', 'Skills'];
    for (const cat of categories) {
      const catPath = path.join(toolkitPath, cat);
      if (fs.existsSync(catPath)) {
        const files = await fs.readdir(catPath);
        console.log(chalk.cyan(`\n🔹 ${cat}:`));
        files.forEach(f => console.log(`  - ${f}`));
      }
    }
  });

program.parse();
