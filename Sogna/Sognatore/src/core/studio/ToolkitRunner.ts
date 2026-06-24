import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export class ToolkitRunner {
  private arsenalPath: string;
  private runnerPath: string;

  constructor() {
    // Determine path to Sogna/toolkit/engines/Studio/arsenal
    this.arsenalPath = path.resolve(process.cwd(), 'engines/Studio/arsenal');
    this.runnerPath = path.join(this.arsenalPath, 'runner.py');
  }

  async run(moduleName: string, inputs: any): Promise<any> {
    if (!fs.existsSync(this.runnerPath)) {
        throw new Error(`[ToolkitRunner] Runner not found at ${this.runnerPath}`);
    }

    const inputJson = JSON.stringify(inputs);
    
    try {
        // Use the runSecure logic (file-based) for standard runs too, 
        // as it avoids command line length limits and shell escaping issues.
        return this.runSecure(moduleName, inputs);
    } catch (error: any) {
        console.error(`[ToolkitRunner] Error executing ${moduleName}:`, error.message);
        throw error;
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
        const pythonBin = this.resolvePython();
        const cmd = `"${pythonBin}" "${this.runnerPath}" ${moduleName} "@${tmpInputFile}"`;
        const output = execSync(cmd, { encoding: 'utf-8', cwd: this.arsenalPath });
        return JSON.parse(output);
    } finally {
        if (fs.existsSync(tmpInputFile)) fs.unlinkSync(tmpInputFile);
    }
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

  private resolvePython(): string {
    const isWin = process.platform === 'win32';
    const projectRoot = this.findProjectRoot(process.cwd());
    const candidates = isWin
      ? [path.join(projectRoot, '.venv', 'Scripts', 'python.exe')]
      : [
          path.join(projectRoot, '.venv', 'bin', 'python3'),
          path.join(projectRoot, '.venv', 'bin', 'python'),
        ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return isWin ? 'python' : 'python3';
  }
}
