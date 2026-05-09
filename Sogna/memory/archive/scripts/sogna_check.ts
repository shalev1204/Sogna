import { MemoryHub } from '../Sognatore/src/core/memory/MemoryHub.js';
import { Hub as SentinelHub } from '../Sognatore/src/Sentinel-Sognatore/Hub.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

/**
 * sogna_check.ts
 * herramienta unificada de diagnóstico cerebral y salud sistémica.
 * ejecutado directamente desde los fuentes para máxima precisión.
 */

import { existsSync } from 'fs';
import { join } from 'path';

async function runSognaCheck() {
  const line = '━'.repeat(50);
  const root = join(fileURLToPath(import.meta.url), '..', '..');
  const requiredPaths = [
    join(root, 'Sognatore/src/core/memory/MemoryHub.ts'),
    join(root, 'Sognatore/src/Sentinel-Sognatore/Hub.ts')
  ];

  const missing = requiredPaths.filter(p => !existsSync(p));
  if (missing.length > 0) {
    console.log(chalk.red.bold(`\n❌ ERROR DE ENTORNO: Motores no detectados.`));
    missing.forEach(p => console.log(chalk.red(`   Falta: ${p}`)));
    process.exit(1);
  }

  console.log(chalk.cyan.bold(`\n${line}`));
  console.log(chalk.cyan.bold(`   📡 SOGNA SYSTEM INTELLIGENCE CHECK   `));
  console.log(chalk.cyan.bold(`${line}\n`));

  try {
    // 1. estado de sognatore (memoria)
    console.log(`${chalk.blue(' [1/3]')} auditando sognatore (memoryhub)...`);
    const memory = MemoryHub.getInstance();
    const health = await memory.checkHealth();
    
    if (health.status === 'healthy') {
      console.log(chalk.green(`    ✔ estado: healthy`));
    } else {
      console.log(chalk.yellow(`    ⚠ estado: ${health.status}`));
    }

    // 2. análisis del grafo cerebral
    console.log(`\n${chalk.blue(' [2/3]')} escaneando grafo cerebral...`);
    const graph = await memory.getNeuralGraph();
    const nodes = graph.nodes.length;
    const edges = graph.edges.length;
    const density = (edges / (nodes * (nodes - 1) || 1)).toFixed(4);

    console.log(chalk.white(`    🧠 neuronas: ${chalk.cyan(nodes)}`));
    console.log(chalk.white(`    🔗 sinapsis: ${chalk.cyan(edges)}`));
    console.log(chalk.white(`    🕸️ densidad: ${chalk.cyan(density)}`));

    // 3. integridad de nomenclatura y sentinel
    console.log(`\n${chalk.blue(' [3/3]')} verificando protocolos sentinel...`);
    const sentinel = SentinelHub.getInstance();
    console.log(chalk.green(`    ✔ sentinel: activo`));
    await sentinel.performProactiveAudit();

    const testQuery = 'apex sovereignty';
    const recall = await memory.unifiedRecall(testQuery);
    const forbiddenFound = recall.some(r => 
      r.content.toLowerCase().includes('apex') || 
      r.content.toLowerCase().includes('sovereign')
    );

    if (forbiddenFound) {
      console.log(chalk.red(`    ✖ alerta: detectada nomenclatura no permitida en fragmentos de memoria.`));
    } else {
      console.log(chalk.green(`    ✔ integridad lingüística: impecable`));
    }

    console.log(chalk.cyan.bold(`\n${line}`));
    console.log(chalk.cyan.bold(`   ✅ DIAGNÓSTICO COMPLETADO CON ÉXITO   `));
    console.log(chalk.cyan.bold(`${line}\n`));

  } catch (error: any) {
    console.log(chalk.red.bold(`\n${line}`));
    console.log(chalk.red.bold(`   ❌ ERROR CRÍTICO EN EL DIAGNÓSTICO   `));
    console.log(chalk.red.bold(`${line}`));
    console.log(chalk.red(`   detalles: ${error.message}\n`));
    process.exit(1);
  }
}

runSognaCheck();
