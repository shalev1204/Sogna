import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { ToolResolver } from './ToolResolver.js';

export class ContextManager {
  private toolResolver: ToolResolver;

  constructor(private readonly cwd: string) {
    this.toolResolver = new ToolResolver(cwd);
  }

  /**
   * Generates a high-level map of the project, respecting .gitignore
   */
  async getCodeMap(): Promise<string> {
    try {
      // Use git to list tracked files (fastest and cleanest)
      const files = execSync('git ls-files', { cwd: this.cwd }).toString().split('\n');
      
      const tree: Record<string, any> = {};
      
      for (const f of files) {
        if (!f) continue;
        const parts = f.split('/');
        let current = tree;
        for (const part of parts) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }

      return this.formatTree(tree);
    } catch {
      // Fallback: simple recursive scan (limited depth)
      return 'Project map unavailable (Git repository not found).';
    }
  }

  /**
   * Summarizes a specific file for the prompt
   */
  async summarizeFile(filePath: string): Promise<string> {
    const fullPath = path.resolve(this.cwd, filePath);
    if (!(await fs.pathExists(fullPath))) return `File not found: ${filePath}`;

    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 50) return content;

    // Smart summarize: Head, Tail, and middle placeholders
    return [
      ...lines.slice(0, 20),
      `\n... [${lines.length - 40} lines omitted] ...\n`,
      ...lines.slice(-20)
    ].join('\n');
  }

  private formatTree(tree: any, indent = ''): string {
    let output = '';
    const keys = Object.keys(tree).sort();
    for (const key of keys) {
      const children = tree[key];
      const isDir = Object.keys(children).length > 0;
      output += `${indent}${isDir ? '📁' : '📄'} ${key}\n`;
      if (isDir) {
        output += this.formatTree(children, indent + '  ');
      }
    }
    return output;
  }
}
