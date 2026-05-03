#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOGNA_ROOT = path.join(__dirname, '..', '..');
const MEMORY_PATH = path.join(SOGNA_ROOT, 'memory', 'agent');
const ARTIFACTS_PATH = process.env.ANTIGRAVITY_ARTIFACTS_DIR || path.join(process.cwd(), '.gemini', 'antigravity', 'brain');

async function sync() {
    console.log(chalk.magenta(`\n[MEMORY_SYNC] 🧬 Sincronizando artefactos de sesión con UMA...`));

    try {
        await fs.ensureDir(MEMORY_PATH);

        // En un entorno real, buscaríamos la carpeta de la sesión actual.
        // Aquí simulamos buscando archivos .md en el directorio de trabajo actual o el de artefactos si se provee.
        // Como soy Antigravity, puedo leer mis propios artefactos.
        
        const filesToSync = [
            'ecosystem_audit.md',
            'walkthrough.md',
            'implementation_plan.md'
        ];

        // Nota: En la ejecución real del agente, los artefactos están en una ruta específica.
        // Para este script de utilidad, permitimos pasar una ruta.
        const sourceDir = process.argv[2] || '.';

        for (const file of filesToSync) {
            const src = path.join(sourceDir, file);
            if (await fs.pathExists(src)) {
                const dest = path.join(MEMORY_PATH, `session_${Date.now()}_${file}`);
                const content = await fs.readFile(src, 'utf-8');
                
                // Inyectar Frontmatter para el Chronicler
                const enrichedContent = `---
key: ${file.replace('.md', '')}
type: operational_insight
tags: [#session_sync, #antigravity]
timestamp: ${new Date().toISOString()}
---
${content}`;

                await fs.writeFile(dest, enrichedContent);
                console.log(chalk.green(`  ✔ Sincronizado: ${file}`));
            }
        }

        console.log(chalk.cyan(`\n[UMA] 🧠 Memoria episódica actualizada. Ejecuta 'sogna doctor --secure' para re-indexar.`));

    } catch (err) {
        console.error(chalk.red(`\n✘ Error en la sincronización: ${err.message}`));
    }
}

sync();
