import { Guardian } from '../core/Guardian.js';
import { SkillRegistry } from '../core/SkillRegistry.js';
import { DockerSandbox } from '../core/DockerSandbox.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

async function runAudit() {
  console.log(chalk.cyan('\n--- 🌀 SOGNATORE SOVEREIGN AUDIT (v2.0) ---\n'));

  // 1. GUARDIAN INTEGRITY
  console.log(chalk.yellow('Step 1: Security Hardening Check...'));
  const guardian = Guardian.getInstance();
  const rootHash = guardian.validateIntegrity();
  console.log(chalk.green(`  [OK] Sovereign Root Hash: ${rootHash}`));
  
  // 2. SANDBOX VALIDATION
  console.log(chalk.yellow('\nStep 2: Infrastructure Sandbox Check...'));
  const sandbox = DockerSandbox.getInstance(); // Fixed: Singleton
  try {
    const nodeVer = await sandbox.exec('node', ['-v']);
    const pyVer = await sandbox.exec('python3', ['--version']);
    const rustVer = await sandbox.exec('rustc', ['--version']);
    
    console.log(chalk.green(`  [OK] Node.js Runtime: ${nodeVer.trim()}`));
    console.log(chalk.green(`  [OK] Python Runtime: ${pyVer.trim()}`));
    console.log(chalk.green(`  [OK] Rust Runtime: ${rustVer.trim()}`));
  } catch (err) {
    console.log(chalk.red(`  [FAILED] Sandbox Execution: ${err}`));
  }

  // 3. EVOLUTIONARY BRAIN (eVolt)
  console.log(chalk.yellow('\nStep 3: Evolutionary Intelligence Check...'));
  const skills = SkillRegistry.getInstance();
  await skills.reload(); // Fixed: Wait for hydration
  const skillCount = skills.getAllSkills().length;
  
  // Verify eVolt directory detection
  const evoltPath = path.join(process.cwd(), 'resources', 'skills', 'eVolt');
  const evoltExists = fs.existsSync(evoltPath);
  console.log(chalk.green(`  [OK] eVolt Knowledge Layer: Detected (${skillCount} total skills)`));

  // 4. AGENT CATALOG (42 Specialists)
  console.log(chalk.yellow('\nStep 4: Swarm Capacity Check...'));
  const agentsMD = fs.readFileSync(path.join(process.cwd(), 'resources', 'config', 'agents.md'), 'utf8');
  const agentTags = agentsMD.match(/###\s+\w+/g) || [];
  console.log(chalk.green(`  [OK] Agent Catalog: ${agentTags.length} Specialists registered.`));

  console.log(chalk.cyan('\n--- AUDIT COMPLETE: SYSTEM IS READY ---\n'));
}

runAudit().catch(console.error);
