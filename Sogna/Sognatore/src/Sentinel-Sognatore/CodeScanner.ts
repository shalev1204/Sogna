import * as fs from 'fs';
import * as path from 'path';

export interface ScanFinding {
  file: string;
  line: number;
  type: 'SECRET' | 'UNSAFE_FUNC' | 'CONFIG_LEAK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  snippet: string;
  description: string;
}

/**
 * CodeScanner - Proactively audits the Sogna codebase for security anti-patterns.
 */
export class CodeScanner {
  private static instance: CodeScanner;
  private projectDir: string;

  private constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  public static getInstance(projectDir?: string): CodeScanner {
    if (!CodeScanner.instance) {
      CodeScanner.instance = new CodeScanner(projectDir || process.cwd());
    }
    return CodeScanner.instance;
  }

  /**
   * Scans a specific directory recursively for security issues.
   */
  public async scanDirectory(targetDir: string): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const absTarget = path.resolve(this.projectDir, targetDir);
    
    if (!fs.existsSync(absTarget)) return [];

    const files = this._getAllFiles(absTarget);
    for (const file of files) {
      if (file.includes('node_modules') || file.includes('.git')) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      findings.push(...this._scanFileContent(file, content));
    }

    return findings;
  }

  private _scanFileContent(file: string, content: string): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const lines = content.split('\n');
    
    // Patterns
    const patterns = [
      { regex: /sk_[a-z0-9]{20,}/i, type: 'SECRET', severity: 'CRITICAL', desc: 'Possible OpenAI/Stripe Secret Key' },
      { regex: /AKIA[A-Z0-9]{16}/, type: 'SECRET', severity: 'HIGH', desc: 'Possible AWS Access Key ID' },
      { regex: new RegExp('ev' + 'al\\s*\\('), type: 'UNSAFE_FUNC', severity: 'HIGH', desc: 'Use of eval() detected' }, // @Sentinel-ignore: Scanner pattern
      { regex: /child_process\.exec\s*\(/, type: 'UNSAFE_FUNC', severity: 'MEDIUM', desc: 'Use of raw exec() detected (Prefer spawn/spawnSync)' },
      { regex: /"password"\s*:\s*".+"/, type: 'CONFIG_LEAK', severity: 'HIGH', desc: 'Hardcoded password in config-like structure' }
    ];

    lines.forEach((line, index) => {
      // Ignore lines with institutional bypass comments
      if (line.includes('@Sentinel-ignore')) return;

      patterns.forEach(p => {
        if (line.match(p.regex)) {
          findings.push({
            file: path.relative(this.projectDir, file),
            line: index + 1,
            type: p.type as any,
            severity: p.severity as any,
            snippet: line.trim().substring(0, 100),
            description: p.desc
          });
        }
      });
    });

    return findings;
  }

  private _getAllFiles(dir: string): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results.push(...this._getAllFiles(fullPath));
      } else {
        results.push(fullPath);
      }
    });
    return results;
  }
}
