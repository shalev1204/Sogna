import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

/**
 * StudioBridge - The connection between Sognatore's Vision and Toolkit's Execution.
 * Unifies the StudioSwarm with the Python-based Media Arsenal.
 */
export class StudioBridge {
  private static instance: StudioBridge;
  private arsenalPath: string;

  private constructor() {
    // Determine the root of the toolkit arsenal
    const projectRoot = this.findProjectRoot(process.cwd());
    this.arsenalPath = path.resolve(projectRoot, 'toolkit/engines/Studio/arsenal');
  }

  public static getInstance(): StudioBridge {
    if (!StudioBridge.instance) {
      StudioBridge.instance = new StudioBridge();
    }
    return StudioBridge.instance;
  }

  private findProjectRoot(start: string): string {
    let curr = start;
    const root = path.parse(curr).root;
    while (curr !== root) {
      if (fs.existsSync(path.join(curr, 'Sognatore'))) return curr;
      curr = path.join(curr, '..');
    }
    return process.cwd();
  }

  /**
   * Executes a specific tool from the Studio Arsenal.
   * @param toolName The script name (e.g., 'hunyuan_video.py')
   * @param args Arguments for the script
   */
  public async executeArsenalTool(toolName: string, args: string[]): Promise<string> {
    const scriptPath = path.join(this.arsenalPath, toolName);
    
    if (!(await fs.pathExists(scriptPath))) {
      throw new Error(`[STUDIO_BRIDGE] Tool not found in arsenal: ${toolName}`);
    }

    console.log(chalk.cyan(`🎬 [STUDIO_BRIDGE] Invoking Arsenal Tool: ${toolName}...`));
    
    try {
      const command = `python "${scriptPath}" ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stdout) {
        console.error(chalk.red(`[STUDIO_BRIDGE] Error in ${toolName}: ${stderr}`));
      }

      return stdout.trim();
    } catch (error) {
      console.error(chalk.red(`[STUDIO_BRIDGE] Failed to execute ${toolName}: ${error}`));
      throw error;
    }
  }

  /**
   * High-level helper for video generation
   */
  public async generateVideo(prompt: string, model: 'hunyuan' | 'kling' | 'wan' = 'hunyuan'): Promise<string> {
    const tool = `${model}_video.py`;
    return this.executeArsenalTool(tool, [`--prompt "${prompt}"`]);
  }
}
