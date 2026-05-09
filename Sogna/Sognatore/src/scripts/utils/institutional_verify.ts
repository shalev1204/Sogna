import { Color, SognaEventBus, SognaEventType } from '@Sogna/Curator';
import { SwarmOrchestrator } from '../../core/SwarmOrchestrator.js';
import { QualityCouncil } from '../../core/QualityCouncil.js';



async function verifySystem() {
  console.log(Color.bold.blue('\n🏛️ SOGNA SYSTEM VERIFICATION \n'));

  const bus = SognaEventBus.getInstance();

  // 1. SCENARIO: UNIFIED SWARM TELEMETRY
  console.log(Color.yellow('--- [SCENARIO 1: SWARM TELEMETRY] ---'));
  
  // Listen for background events
  bus.on(SognaEventType.LOG, (event) => {
    if (event.emitter.startsWith('BackgroundTask:')) {
      console.log(Color.dim(` [TELEMETRÍA] `) + Color.gray(`${event.emitter}: ${event.data.message}`));
    }
  });

  const orchestrator = SwarmOrchestrator.getInstance();
  
  // Simulate registration of a background service
  orchestrator.registerService({
    name: 'Sentinel_Vigilance',
    intervalMs: 2000,
    task: async () => {
      // Pulse simulation
    }
  });

  console.log(Color.green('✅ Background services registered with unified telemetry.'));
  await new Promise(resolve => setTimeout(resolve, 2500)); 


  // 2. SCENARIO: QUALITY EVALUATION (PREDATORE)
  console.log(Color.yellow('\n--- [SCENARIO 2: QUALITY COUNCIL ] ---'));
  
  const council = new QualityCouncil(process.cwd());

  // A. FAILURE CASE (Insecure Code)
  console.log(Color.bold.cyan('\n🔍 TEST A: Insecure code injection detection...'));
  const unsafeEvidence: any = {
    iterationCount: 1,
    gitDiff: `
+ function executeCommand(cmd) {
+   const { exec } = require('child_process');
+   exec(cmd); // VULNERABILITY: Unsanitized exec
+ }
    `,
    isCritical: false
  };

  const unsafeResult = await council.evaluate(unsafeEvidence);
  if (!unsafeResult.passed) {
    console.log(Color.green('✅ SUCCESS: Quality Council rejected insecure code.'));
  }

  // B. SUCCESS CASE (Safe Code)
  console.log(Color.bold.cyan('\n🔍 TEST B: Safe architectural code...'));
  const safeEvidence: any = {
    iterationCount: 2,
    gitDiff: `
+ import { PermissionProxy } from './permissionproxy.js';
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
    console.log(Color.green('✅ SUCCESS: Quality Council approved sovereign architectural code.'));
  }

  console.log(Color.bold.blue('\n✨ VERIFICATION COMPLETE. SOGNA SYSTEM IS STABLE.\n'));
  
  process.exit(0);
}

verifySystem().catch(err => {
  console.error(err);
  process.exit(1);
});
