import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * High-Assurance Docker Sandbox
 * Executes commands in an isolated container with Node, Python, and Rust.
 */
export class DockerSandbox {
  private static instance: DockerSandbox;
  private readonly IMAGE_NAME = 'sognatore-sovereign:latest';
  private readonly DOCKERFILE_PATH = path.join(process.cwd(), 'resources', 'docker', 'Sovereign.Dockerfile');

  private constructor() {
    this.ensureImage();
  }

  public static getInstance(): DockerSandbox {
    if (!DockerSandbox.instance) {
      DockerSandbox.instance = new DockerSandbox();
    }
    return DockerSandbox.instance;
  }

  /**
   * Ensures the sovereign image exists locally.
   */
  private ensureImage() {
    try {
      execSync(`docker image inspect ${this.IMAGE_NAME}`, { stdio: 'ignore' });
    } catch (e) {
      console.log(chalk.yellow(`[SANDBOX] Sovereign Image missing. Building...`));
      this.buildImage();
    }
  }

  private buildImage() {
    if (!fs.existsSync(this.DOCKERFILE_PATH)) {
      throw new Error(`Dockerfile not found at ${this.DOCKERFILE_PATH}`);
    }
    
    console.log(chalk.cyan(`[SANDBOX] Constructing Sovereign Multi-Language Environment (Node/Python/Rust)...`));
    execSync(`docker build -t ${this.IMAGE_NAME} -f ${this.DOCKERFILE_PATH} .`, { stdio: 'inherit' });
    console.log(chalk.green(`[SANDBOX] Image ${this.IMAGE_NAME} built successfully.`));
  }

  /**
   * Executes a command inside the sandbox.
   * Mounts the current working directory as /workspace.
   */
  public exec(command: string, args: string[] = []): string {
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    const cwd = process.cwd();
    
    // Command construction
    // --rm: Cleanup after exit
    // -v: Mount CWD
    // -w: Set working dir
    const dockerCmd = `docker run --rm -v "${cwd}:/workspace" -w /workspace ${this.IMAGE_NAME} /bin/bash -c "${fullCommand.replace(/"/g, '\\"')}"`;
    
    try {
      const output = execSync(dockerCmd, { encoding: 'utf8', stdio: 'pipe' });
      return output.trim();
    } catch (error: any) {
      const errorMessage = error.stderr ? error.stderr.toString() : error.message;
      throw new Error(`[SANDBOX_FAILURE] ${errorMessage}`);
    }
  }
}
