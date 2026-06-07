#!/usr/bin/env node
import { Color } from '@Sogna/Curator';
import { FS as fs } from '@Sogna/Curator/shared/utils/fs.js';
import path from 'path';
import { fileURLToPath } from 'url';


const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const SOGNA_ROOT = path.join(_dirname, '..', '..');
const MEMORY_PATH = path.join(SOGNA_ROOT, 'memory', 'agent');
const ARTIFACTS_PATH = process.env.ANTIGRAVITY_ARTIFACTS_DIR || path.join(process.cwd(), '.gemini', 'antigravity', 'processor');

async function sync() {
    console.log(Color.magenta(`\n[MEMORY_SYNC] 🧬 Sincronizando artefactos de sesión con UMA...`));

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
                console.log(Color.green(`  ✔ Sincronizado: ${file}`));
            }
        }

        console.log(Color.cyan(`\n[UMA] 🧠 Memoria episódica actualizada. Ejecuta 'Sogna doctor --secure' para re-indexar.`));

    } catch (err) {
        console.error(Color.red(`\n✘ Error en la sincronización: ${err.message}`));
    }
}

sync();
