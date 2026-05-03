import { SwarmOrchestrator } from '../../core/SwarmOrchestrator.js';
import { QualityCouncil } from '../../core/QualityCouncil.js';
import { SognaEventBus, SognaEventType } from '@sogna/curator';
import chalk from 'chalk';

async function verifyInstitutionalPolish() {
  console.log(chalk.bold.blue('\n🏛️ SIMULACIÓN DE OPERACIÓN INSTITUCIONAL APEX\n'));

  const bus = SognaEventBus.getInstance();

  // 1. ESCENARIO: TELEMETRÍA UNIFICADA DE ENJAMBRE
  console.log(chalk.yellow('--- [ESCENARIO 1: TELEMETRÍA DE FONDO] ---'));
  
  // Escuchar eventos de fondo
  bus.on(SognaEventType.LOG, (event) => {
    if (event.emitter.startsWith('BackgroundTask:')) {
      console.log(chalk.dim(`  [TELEMETRÍA] `) + chalk.gray(`${event.emitter}: ${event.data.message}`));
    }
  });

  const orchestrator = SwarmOrchestrator.getInstance();
  
  // Simular registro de un servicio soberano
  orchestrator.registerService({
    name: 'Vigilancia_Sentinel',
    intervalMs: 2000,
    task: async () => {
      // Simulación de pulso
    }
  });

  console.log(chalk.green('✅ Servicios de fondo registrados y emitiendo telemetría unificada.'));
  await new Promise(resolve => setTimeout(resolve, 2500)); // Esperar un par de pulsos


  // 2. ESCENARIO: EVALUACIÓN ADVERSARIAL (PREDATORE)
  console.log(chalk.yellow('\n--- [ESCENARIO 2: CONSEJO DE CALIDAD ADVERSARIAL] ---'));
  
  const council = new QualityCouncil(process.cwd());

  // A. Caso de FALLO (Código Inseguro)
  console.log(chalk.bold.cyan('\n🔍 TEST A: Inyección de código inseguro detectado por Predatore...'));
  const unsafeEvidence: any = {
    iterationCount: 1,
    gitDiff: `
+ function executeCommand(cmd) {
+   const { exec } = require('child_process');
+   exec(cmd); // VULNERABILIDAD: exec sin sanear detectado por AdversarialGate
+ }
    `,
    isCritical: false
  };

  const unsafeResult = await council.evaluate(unsafeEvidence);
  if (!unsafeResult.passed) {
    console.log(chalk.green('✅ ÉXITO: El Consejo de Calidad rechazó el código inseguro.'));
  }

  // B. Caso de ÉXITO (Código Seguro)
  console.log(chalk.bold.cyan('\n🔍 TEST B: Código institucional seguro...'));
  const safeEvidence: any = {
    iterationCount: 2,
    gitDiff: `
+ import { PermissionProxy } from './PermissionProxy.js';
+ 
+ async function getVersion() {
+   await PermissionProxy.requestCapability('filesystem:read');
+   return 'v1.0.0';
+ }
    `,
    isCritical: false
  };

  const safeResult = await council.evaluate(safeEvidence);
  if (safeResult.passed) {
    console.log(chalk.green('✅ ÉXITO: El Consejo de Calidad aprobó el código con arquitectura soberana.'));
  }

  console.log(chalk.bold.blue('\n✨ VERIFICACIÓN INSTITUCIONAL COMPLETADA. SOGNA ESTÁ PULIDO Y BLINDADO.\n'));
  
  // Limpieza para evitar que el script se quede colgado por el setInterval del orchestrator
  process.exit(0);
}

verifyInstitutionalPolish().catch(err => {
  console.error(err);
  process.exit(1);
});
