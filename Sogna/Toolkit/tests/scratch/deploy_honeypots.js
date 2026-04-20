import { HoneypotManager } from '../Sognatore/src/core/security/HoneypotManager.js';

async function deploy() {
  const manager = new HoneypotManager();
  await manager.deploy();
  console.log('Honeypots deployed successfully.');
}

deploy().catch(console.error);
