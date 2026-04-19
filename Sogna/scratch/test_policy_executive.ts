import { PolicyEngine } from '../Sognatore/src/policies/PolicyEngine.js';
import { Decision } from '../Sognatore/src/policies/PolicyTypes.js';

async function testPolicyEngine() {
  const engine = new PolicyEngine();
  
  console.log("\n--- Testing PolicyEngine Executive Integration ---");

  // Test sensitive evaluation
  const context = {
    sensitive: true,
    tool_name: 'fs_write',
    arguments: { TargetFile: '.env' },
    trust_score: 0.9
  };

  console.log("Evaluating sensitive write to .env...");
  const result = engine.evaluate('pre_execution', context);
  console.log("Decision:", result.decision);
  console.log("Reason:", result.reason);

  if (result.decision === Decision.DENY) {
    console.log("SUCCESS: PolicyEngine correctly delegated to Rust for security veto.");
  } else {
    console.log("FAILURE: PolicyEngine did not deny the sensitive operation.");
  }
}

testPolicyEngine().catch(console.error);
