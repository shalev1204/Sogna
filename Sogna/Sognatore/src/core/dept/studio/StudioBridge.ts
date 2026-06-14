import { Color, FS as fs } from '@Sogna/Curator';
import { exec } from 'child_process';
import path from 'path';

import { promisify } from 'util';


const execAsync = promisify(exec);

/**
 * StudioBridge - The connection between Sognatore's Vision and Toolkit's Execution.
 * Unifies the Studioswarm with the Python-based Media Toolkit.
 */
export class StudioBridge {
  private static instance: StudioBridge;
  private arsenalPath: string;

  private constructor() {
    // Determine the root of the toolkit arsenal
    const projectRoot = this.findProjectRoot(process.cwd());
    this.arsenalPath = path.resolve(projectRoot, 'engines/Studio/arsenal');
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
   * Executes a specific tool from the Studio Toolkit.
   * @param toolName The script name (e.g., 'hunyuan_video.py')
   * @param args Arguments for the script
   */
  public async executeToolkitTool(toolName: string, args: string[]): Promise<string> {
    const scriptPath = path.join(this.arsenalPath, toolName);
    
    if (!(await fs.pathExists(scriptPath))) {
      throw new Error(`[STUDIO_BRIDGE] Tool not found in arsenal: ${toolName}`);
    }

    console.log(Color.cyan(`🎬 [STUDIO_BRIDGE] Invoking Toolkit Tool: ${toolName}...`));
    
    try {
      const command = `python "${scriptPath}" ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stdout) {
        console.error(Color.red(`[STUDIO_BRIDGE] Error in ${toolName}: ${stderr}`));
      }

      return stdout.trim();
    } catch (error) {
      console.error(Color.red(`[STUDIO_BRIDGE] Failed to execute ${toolName}: ${error}`));
      throw error;
    }
  }

  /**
   * High-level helper for video generation
   */
  public async generateVideo(prompt: string, model: 'hunyuan' | 'kling' | 'wan' = 'hunyuan'): Promise<string> {
    const tool = `${model}_video.py`;
    return this.executeToolkitTool(tool, [`--prompt "${prompt}"`]);
  }
}
