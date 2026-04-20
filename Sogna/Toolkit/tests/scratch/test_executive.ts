import { ToolRegistry } from '../Sognatore/src/core/actions/ToolRegistry.js';

async function testExecutive() {
  const registry = ToolRegistry.getInstance();
  
  console.log("--- Testing Executive Autonomy Protocol ---");
  
  // 1. Test allowed tool
  console.log("\nScenario 1: Allowed tool (fs_read)");
  const readResult = await registry.call('fs_read', { path: 'package.json' }, 'gold');
  console.log("Result type:", readResult.startsWith('{') ? 'JSON/Content' : 'Status Message');

  // 2. Test denied tool (sensitive file)
  console.log("\nScenario 2: Denied tool (writing to .env)");
  const writeResult = await registry.call('fs_write', { path: '.env', content: 'SECRET=REVEALED' }, 'gold');
  console.log("Result:", writeResult);

  // 3. Test low trust score (mocked via tier)
  console.log("\nScenario 3: Low trust score escalation");
  const lowTrustResult = await registry.call('shell_exec', { command: 'dir' }, 'silver');
  console.log("Result:", lowTrustResult);
}

testExecutive().catch(console.error);
