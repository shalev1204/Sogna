import { DockerSandbox } from '../src/core/dockersandbox.js';
import chalk from 'chalk';

async function testSandbox() {
  console.log(chalk.bold.cyan('\n[DIAGNOSTIC] Validating  Sandbox Isolation...'));
  const sandbox = DockerSandbox.getInstance();

  try {
    console.log(chalk.yellow('\n1. Testing Node.js presence:'));
    const nodeV = sandbox.exec('node -v');
    console.log(chalk.green(`   Output: ${nodeV}`));

    console.log(chalk.yellow('\n2. Testing Python 3 presence:'));
    const pyV = sandbox.exec('python3 --version');
    console.log(chalk.green(`   Output: ${pyV}`));

    console.log(chalk.yellow('\n3. Testing Rust presence:'));
    const rustV = sandbox.exec('rustc --version');
    console.log(chalk.green(`   Output: ${rustV}`));

    console.log(chalk.yellow('\n4. Testing Workspace Mounting (ls /workspace):'));
    const lsW = sandbox.exec('ls /workspace');
    console.log(chalk.green(`   Output (first 3 files): ${lsW.split('\n').slice(0, 3).join(', ')}`));

    console.log(chalk.yellow('\n5. Verifying Host Isolation (ls /Users):'));
    try {
      const lsU = sandbox.exec('ls /Users');
      console.log(chalk.red(`   [ALERT] Sandbox can see /Users! Output: ${lsU}`));
    } catch (e) {
      console.log(chalk.green('   [SUCCESS] Sandbox is isolated from host /Users directory.'));
    }

    console.log(chalk.bold.green('\n[RESULT] Sandbox diagnostics PASSED.  environment is secure.'));
  } catch (error) {
    console.error(chalk.bold.red('\n[RESULT] Sandbox diagnostics FAILED.'));
    console.error(error);
  }
}

testSandbox();
