import { Hub } from './src/Sentinel-Sognatore/Hub.js';
import { SecurityAudit } from './src/Sentinel-Sognatore/SecurityAudit.js';
import { CodeScanner } from './src/Sentinel-Sognatore/CodeScanner.js';
import { HealthGuard } from './src/core/system/HealthGuard.js';
import chalk from 'chalk';

/**
 * SOGNA INSTITUTIONAL DIAGNOSTIC
 * Herramienta oficial de verificacin de salud, soberana y seguridad.
 */
async function runInstitutionalDiagnostic() {
  console.log(chalk.bold.blue('\n🚀 INICIANDO DIAGNÓSTICO PROFUNDO: SOGNA STABLE VERSION\n'));

  const hub = Hub.getInstance();
  const auditor = SecurityAudit.getInstance();
  const scanner = CodeScanner.getInstance();
  const guard = HealthGuard.getInstance();

  // 1. HEALTH CHECK
  console.log(chalk.yellow('--- [PLANE 1: SALUD DEL SISTEMA] ---'));
  const health = await guard.performFullDiagnostic();
  if (health.status === 'HEALTHY') {
    console.log(chalk.green('✅ Sistema saludable. Todos los Hubs operativos.'));
  } else {
    console.log(chalk.red(`❌ Problemas de salud detectados: ${health.details.join(', ')}`));
  }

  // 2. SOVEREIGNTY CHECK (No external residues)
  console.log(chalk.yellow('\n--- [PLANE 2: SOBERANÍA E IDENTIDAD] ---'));
  const findings = await scanner.scanDirectory('src');
  const externalTraces = findings.filter(f => f.snippet.toLowerCase().includes('obsidian'));
  if (externalTraces.length === 0) {
    console.log(chalk.green('✅ Soberanía confirmada. No se detectaron rastros externos en el núcleo.'));
  } else {
    console.log(chalk.red(`❌ Residuos externos detectados: ${externalTraces.length} menciones de Obsidian.`));
  }

  // 3. SECURITY & AUDIT
  console.log(chalk.yellow('\n--- [PLANE 3: SEGURIDAD Y AUDITORÍA] ---'));
  const isChainValid = auditor.verifyChain();
  console.log(isChainValid ? chalk.green('✅ Integridad de auditoría: Verificada.') : chalk.red('❌ Cadena de auditoría CORRUPTA.'));
  
  await hub.performProactiveAudit();
  console.log(chalk.green('✅ Auditoría proactiva completada.'));

  console.log(chalk.bold.blue('\n✨ DIAGNÓSTICO FINALIZADO: SOGNA ESTÁ EN ESTADO ÓPTIMO.\n'));
}

runInstitutionalDiagnostic().catch(err => {
  console.error(chalk.red('\n💥 FALLO CRÍTICO EN EL DIAGNÓSTICO:'), err);
  process.exit(1);
});
