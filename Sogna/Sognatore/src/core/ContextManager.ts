import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { ToolResolver } from './ToolResolver.js';

interface FileTree {
  [key: string]: FileTree;
}

export class ContextManager {
  private toolResolver: ToolResolver;

  constructor(private readonly cwd: string) {
    this.toolResolver = new ToolResolver(cwd);
  }

  /**
   * Generates a high-level map of the project, respecting .gitignore.
   * Optimized to prevent ENAMETOOLONG errors on Windows.
   */
  async getCodeMap(): Promise<string> {
    try {
      // Use git to list tracked files (fastest and cleanest)
      const files = execSync('git ls-files', { cwd: this.cwd }).toString().split('\n');
      
      const tree: FileTree = {};
      const MAX_FILES = 100; // Cap for individual file listing before summarization
      
      const limitedFiles = files.filter(f => f.trim()).length > MAX_FILES 
        ? files.filter(f => f.trim()).slice(0, MAX_FILES) 
        : files.filter(f => f.trim());

      for (const f of limitedFiles) {
        const parts = f.split('/');
        let current = tree;
        for (const part of parts) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }

      let output = this.formatTree(tree);
      if (files.length > MAX_FILES) {
        output += `\n... [${files.length - MAX_FILES} additional files omitted for swarm performance] ...\n`;
      }
      return output;
    } catch {
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
    
    // Performance cap: don't pass more than 10KB per file summary
    if (content.length > 10000) {
      return `[FILE TOO LARGE: ${Math.round(content.length/1024)}KB] - Summarizing head/tail only.\n` + 
        [...lines.slice(0, 30), '\n... [truncated] ...\n', ...lines.slice(-30)].join('\n');
    }

    if (lines.length < 50) return content;

    return [
      ...lines.slice(0, 20),
      `\n... [${lines.length - 40} lines omitted] ...\n`,
      ...lines.slice(-20)
    ].join('\n');
  }

  private formatTree(tree: FileTree, indent = '', depth = 0): string {
    if (depth > 5) return `${indent}... [Deep structure truncated] ...\n`;
    
    let output = '';
    const keys = Object.keys(tree).sort();
    for (const key of keys) {
      const children = tree[key];
      const isDir = Object.keys(children).length > 0;
      output += `${indent}${isDir ? '📁' : '📄'} ${key}\n`;
      if (isDir) {
        output += this.formatTree(children, indent + '  ', depth + 1);
      }
    }
    return output;
  }
}
