import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * High-Assurance Docker Sandbox
 * Executes commands in an isolated container with Node, Python, and Rust.
 */
export type SandboxProfile = 'standard' | 'security';

/**
 * High-Assurance Docker Sandbox
 * Executes commands in an isolated container with Node, Python, and Rust.
 * Supports multiple profiles for specialized missions.
 */
export class DockerSandbox {
  private static instance: DockerSandbox;
  private currentProfile: SandboxProfile = 'standard';

  private readonly IMAGES = {
    standard: 'sognatore:latest',
    security: 'sognatore-security:latest'
  };

  private readonly DOCKERFILES = {
    standard: path.join(process.cwd(), 'Sognatore', 'resources', 'docker', '.Dockerfile'),
    security: path.join(process.cwd(), 'Sognatore', 'resources', 'docker', 'Security.Dockerfile')
  };

  private constructor() {
    this.ensureImages();
  }

  public static getInstance(): DockerSandbox {
    if (!DockerSandbox.instance) {
      DockerSandbox.instance = new DockerSandbox();
    }
    return DockerSandbox.instance;
  }

  /**
   * Switches the active sandbox profile.
   */
  public setProfile(profile: SandboxProfile) {
    this.currentProfile = profile;
    console.log(chalk.blue(`[SANDBOX] Switched to ${chalk.bold(profile)} profile.`));
  }

  /**
   * Ensures the required images exist locally.
   */
  private ensureImages() {
    for (const [profile, image] of Object.entries(this.IMAGES)) {
      try {
        execSync(`docker image inspect ${image}`, { stdio: 'ignore' });
      } catch (e) {
        console.log(chalk.yellow(`[SANDBOX] Image for ${profile} missing. Building...`));
        this.buildImage(profile as SandboxProfile);
      }
    }
  }

  private buildImage(profile: SandboxProfile) {
    const dockerfile = this.DOCKERFILES[profile];
    const image = this.IMAGES[profile];

    if (!fs.existsSync(dockerfile)) {
      console.warn(chalk.red(`[SANDBOX] Warning: Dockerfile not found at ${dockerfile}. Skipping build for ${profile}.`));
      return;
    }
    
    console.log(chalk.cyan(`[SANDBOX] Constructing ${profile} Environment...`));
    execSync(`docker build -t ${image} -f ${dockerfile} .`, { stdio: 'inherit' });
    console.log(chalk.green(`[SANDBOX] Image ${image} built successfully.`));
  }

  /**
   * Executes a command inside the sandbox.
   * Mounts the current working directory as /workspace.
   */
  public exec(command: string, args: string[] = []): string {
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    const cwd = process.cwd();
    const image = this.IMAGES[this.currentProfile];
    
    // Command construction
    // --rm: Cleanup after exit
    // -v: Mount CWD
    // -w: Set working dir
    const dockerCmd = `docker run --rm -v "${cwd}:/workspace" -w /workspace ${image} /bin/bash -c "${fullCommand.replace(/"/g, '\\"')}"`;
    
    try {
      const output = execSync(dockerCmd, { encoding: 'utf8', stdio: 'pipe' });
      return output.trim();
    } catch (error: any) {
      const errorMessage = error.stderr ? error.stderr.toString() : error.message;
      throw new Error(`[SANDBOX_FAILURE] [${this.currentProfile}] ${errorMessage}`);
    }
  }
}
