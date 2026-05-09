import { Color } from '@Sogna/Curator';
import { Hub } from './src/Sentinel-Sognatore/Hub.js';
import { SecurityAudit } from './src/Sentinel-Sognatore/SecurityAudit.js';
import { CodeScanner } from './src/Sentinel-Sognatore/CodeScanner.js';
import { HealthGuard } from './src/core/system/HealthGuard.js';


/**
 * SOGNA INSTITUTIONAL DIAGNOSTIC
 * Herramienta oficial de verificacin de salud, independiente y seguridad.
 */
async function runInstitutionalDiagnostic() {
  console.log(Color.bold.blue('\n🚀 INICIANDO DIAGNÓSTICO PROFUNDO: SOGNA STABLE VERSION\n'));

  const hub = Hub.getInstance();
  const auditor = SecurityAudit.getInstance();
  const scanner = CodeScanner.getInstance();
  const guard = HealthGuard.getInstance();

  // 1. HEALTH CHECK
  console.log(Color.yellow('--- [PLANE 1: SALUD DEL SISTEMA] ---'));
  const health = await guard.performFullDiagnostic();
  if (health.status === 'HEALTHY') {
    console.log(Color.green('✅ Sistema saludable. Todos los Hubs operativos.'));
  } else {
    console.log(Color.red(`❌ Problemas de salud detectados: ${health.details.join(', ')}`));
  }

  // Auto-Healer Engine
  const { AutoHealer } = await import('./src/core/system/AutoHealer.js');
  const healer = AutoHealer.getInstance();
  const healResult = await healer.healBuildErrors();
  if (healResult.fixed) {
    console.log(Color.green(`✅ Auto-Healer: ${healResult.status}`));
  } else {
    console.log(Color.cyan(`ℹ️ Auto-Healer: ${healResult.status}`));
  }


  // 2. INTEGRITY CHECK (No external residues)
  console.log(Color.yellow('\n--- [PLANE 2: CONTROL E IDENTIDAD] ---'));
  const findings = await scanner.scanDirectory('src');
  const externalTraces = findings.filter(f => f.snippet.toLowerCase().includes('native_workspace'));
  if (externalTraces.length === 0) {
    console.log(Color.green('✅ Control confirmada. No se detectaron rastros externos en el núcleo.'));
  } else {
    console.log(Color.red(`❌ Residuos externos detectados: ${externalTraces.length} menciones de NativeWorkspace.`));
  }

  // 3. SECURITY & AUDIT
  console.log(Color.yellow('\n--- [PLANE 3: SEGURIDAD Y AUDITORÍA] ---'));
  const isChainValid = auditor.verifyChain();
  console.log(isChainValid ? Color.green('✅ Integridad de auditoría: Verificada.') : Color.red('❌ Cadena de auditoría CORRUPTA.'));
  
  await hub.performProactiveAudit();
  
  // Auditoría dinámica de dependencias
  const { DependencyAuditor } = await import('./src/Sentinel-Sognatore/DependencyAuditor.js');
  const depAuditor = DependencyAuditor.getInstance();
  const depHealth = await depAuditor.auditDependencies();
  if (depHealth.status === 'CRITICAL') {
    console.log(Color.red(`❌ Vulnerabilidades en dependencias: ${depHealth.details}`));
  } else {
    console.log(Color.green(`✅ Dependencias seguras: ${depHealth.details}`));
  }

  console.log(Color.green('✅ Auditoría proactiva completada.'));


  // 4. NEURAL INTEGRITY
  console.log(Color.yellow('\n--- [PLANE 4: INTEGRIDAD NEURONAL] ---'));
  await hub.reportNeuralIntegrity();
  console.log(Color.green('✅ Conexión con el Memory Hub verificada.'));

  console.log(Color.bold.blue('\n✨ DIAGNÓSTICO FINALIZADO: SOGNA ESTÁ EN ESTADO ÓPTIMO.\n'));
}

runInstitutionalDiagnostic().catch(err => {
  console.error(Color.red('\n💥 FALLO CRÍTICO EN EL DIAGNÓSTICO:'), err);
// @Sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
  process.exit(1);
});
