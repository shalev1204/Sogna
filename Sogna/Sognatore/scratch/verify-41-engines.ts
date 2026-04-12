import { AgentFactory } from '../src/core/agents/AgentFactory.js';
import { AGENT_SWARM_MAPPING } from '../src/core/agents/AgentTypes.js';
import chalk from 'chalk';

async function verifyAllAgents() {
  console.log(chalk.bold.cyan('\nSOGNATORE: 41-Agent Engine Diagnostic'));
  console.log(chalk.dim('======================================='));

  const factory = await AgentFactory.getInstance();
  let successCount = 0;
  let failCount = 0;

  const allAgentTypes = Object.values(AGENT_SWARM_MAPPING).flat();
  console.log(chalk.blue(`Total defined agents to verify: ${allAgentTypes.length}\n`));

  if (allAgentTypes.length !== 41) {
    console.log(chalk.red(`[CRITICAL] Agent mapping mismatch! Expected 41, found ${allAgentTypes.length}`));
  }

  for (const type of allAgentTypes) {
    try {
      const { role, provider, model, tier } = await factory.getAgent(type);
      console.log(chalk.green(`  ✔ [HYDRATED] ${type.padEnd(20)} | Swarm: ${role.swarm.padEnd(12)} | Tier: ${tier.padEnd(10)} | Model: ${model}`));
      
      if (role.capabilities.length === 0) {
        console.log(chalk.yellow(`    ⚠ Warning: Agent ${type} has 0 capabilities defined.`));
      }
      
      successCount++;
    } catch (error: any) {
      console.log(chalk.red(`  ✘ [FAILED]   ${type.padEnd(20)} | Error: ${error.message}`));
      failCount++;
    }
  }

  console.log(chalk.dim('\n---------------------------------------'));
  if (failCount === 0 && successCount === 41) {
    console.log(chalk.bold.green(`\n[DIAGNOSTIC PASS] All 41 engines are 100% operational.`));
    console.log(chalk.green(`The swarm is purified and ready for RARV execution.`));
  } else {
    console.log(chalk.bold.red(`\n[DIAGNOSTIC FAIL] Swarm integrity compromised.`));
    console.log(chalk.red(`Success: ${successCount} | Failures: ${failCount}`));
    process.exit(1);
  }
}

verifyAllAgents().catch(err => {
  console.error(err);
  process.exit(1);
});
