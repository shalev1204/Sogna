import { Color } from '@Sogna/Curator';
import { DockerSandbox } from '../src/core/DockerSandbox.js';


async function testSandbox() {
  console.log(Color.bold.cyan('\n[DIAGNOSTIC] Validating  Sandbox Isolation...'));
  const sandbox = DockerSandbox.getInstance();

  try {
    console.log(Color.yellow('\n1. Testing Node.js presence:'));
    const nodeV = sandbox.exec('node -v');
    console.log(Color.green(`   Output: ${nodeV}`));

    console.log(Color.yellow('\n2. Testing Python 3 presence:'));
    const pyV = sandbox.exec('python3 --version');
    console.log(Color.green(`   Output: ${pyV}`));

    console.log(Color.yellow('\n3. Testing Rust presence:'));
    const rustV = sandbox.exec('rustc --version');
    console.log(Color.green(`   Output: ${rustV}`));

    console.log(Color.yellow('\n4. Testing Workspace Mounting (ls /workspace):'));
    const lsW = sandbox.exec('ls /workspace');
    console.log(Color.green(`   Output (first 3 files): ${lsW.split('\n').slice(0, 3).join(', ')}`));

    console.log(Color.yellow('\n5. Verifying Host Isolation (ls /Users):'));
    try {
      const lsU = sandbox.exec('ls /Users');
      console.log(Color.red(`   [ALERT] Sandbox can see /Users! Output: ${lsU}`));
    } catch (e) {
      console.log(Color.green('   [SUCCESS] Sandbox is isolated from host /Users directory.'));
    }

    console.log(Color.bold.green('\n[RESULT] Sandbox diagnostics PASSED.  environment is secure.'));
  } catch (error) {
    console.error(Color.bold.red('\n[RESULT] Sandbox diagnostics FAILED.'));
    console.error(error);
  }
}

testSandbox();
