import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export class ArsenalRunner {
  private arsenalPath: string;
  private runnerPath: string;

  constructor() {
    // Determine path to Sogna/toolkit/engines/Studio/arsenal
    this.arsenalPath = path.resolve(process.cwd(), '../toolkit/engines/Studio/arsenal');
    this.runnerPath = path.join(this.arsenalPath, 'runner.py');
  }

  async run(moduleName: string, inputs: any): Promise<any> {
    if (!fs.existsSync(this.runnerPath)) {
        throw new Error(`[ArsenalRunner] Runner not found at ${this.runnerPath}`);
    }

    const inputJson = JSON.stringify(inputs);
    // Escape double quotes for Windows shell if necessary, but execSync with array might be safer if supported, 
    // however usually we use a string for execSync on windows.
    // Let's use a temporary file for inputs to avoid shell escaping hell.
    const tmpInputFile = path.join(this.arsenalPath, `tmp_input_${Date.now()}.json`);
    fs.writeFileSync(tmpInputFile, inputJson);

    try {
        const cmd = `python "${this.runnerPath}" ${moduleName} "$(cat "${tmpInputFile}")"`;
        // Wait, 'cat' is not on windows usually unless using busybox. 
        // Let's just pass the file path to runner.py instead.
        
        const cmdWindows = `python "${this.runnerPath}" ${moduleName} "${inputJson.replace(/"/g, '\\"')}"`;
        // If input is huge, this might fail. Let's update runner.py to accept a file.
        
        const output = execSync(cmdWindows, { encoding: 'utf-8', cwd: this.arsenalPath });
        return JSON.parse(output);
    } catch (error: any) {
        console.error(`[ArsenalRunner] Error executing ${moduleName}:`, error.message);
        throw error;
    } finally {
        if (fs.existsSync(tmpInputFile)) fs.unlinkSync(tmpInputFile);
    }
  }

  /**
   * Refined run that uses file-based input for safety.
   */
  async runSecure(moduleName: string, inputs: any): Promise<any> {
    const tmpInputFile = path.join(this.arsenalPath, `in_${moduleName}_${Date.now()}.json`);
    fs.writeFileSync(tmpInputFile, JSON.stringify(inputs));

    try {
        // We'll update runner.py to handle file inputs if the arg starts with @
        const cmd = `python "${this.runnerPath}" ${moduleName} "@${tmpInputFile}"`;
        const output = execSync(cmd, { encoding: 'utf-8', cwd: this.arsenalPath });
        return JSON.parse(output);
    } finally {
        if (fs.existsSync(tmpInputFile)) fs.unlinkSync(tmpInputFile);
    }
  }
}
