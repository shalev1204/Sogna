import { BaseGate } from './BaseGate.js';
import { GateResult, CouncilEvidence } from './types.js';
import { execa } from 'execa';
import path from 'path';

export class CompatibilityGate extends BaseGate {
  get id() { return 'QG-010'; }
  get name() { return 'Backward Compatibility (Gate 10)'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const modifiedFiles = this.getModifiedExistingFiles(evidence.gitDiff || '');
    const findings: any[] = [];

    if (modifiedFiles.length === 0) {
      return this.pass({ message: 'No existing files modified.' });
    }

    // Check for Vitest availability
    const hasVitest = await this.toolResolver.isAvailable('vitest');
    if (!hasVitest) {
      return this.fail('Vitest is not installed. Gate 10 requires an industry-standard test runner.', 'CRITICAL');
    }

    const resolvedVitest = this.toolResolver.resolve('vitest');

    for (const file of modifiedFiles) {
      const testFile = this.findTestForFile(file);
      
      if (!testFile) {
        findings.push({
          severity: 'HIGH',
          message: `File ${file} was modified but no test suite was found. Regression risk is high.`,
          file
        });
        continue;
      }

      try {
        // Run specific test for this file
        await execa(resolvedVitest, ['run', testFile], { cwd: this.cwd });
      } catch (error: any) {
        findings.push({
          severity: 'CRITICAL',
          message: `Regression detected in ${file}. Test suite ${testFile} failed.`,
          file
        });
      }
    }

    return {
      gateId: this.id,
      gateName: this.name,
      status: findings.length > 0 ? 'FAIL' : 'PASS',
      findings
    };
  }

  private getModifiedExistingFiles(diff: string): string[] {
    const lines = diff.split('\n');
    const files: string[] = [];
    
    // Simple diff parser for "--- a/path/to/file"
    for (const line of lines) {
      if (line.startsWith('--- a/')) {
        const filePath = line.replace('--- a/', '').trim();
        if (filePath !== '/dev/null') {
          files.push(filePath);
        }
      }
    }
    return files;
  }

  private findTestForFile(filePath: string): string | null {
    const basename = path.basename(filePath, path.extname(filePath));
    const dirname = path.dirname(filePath);
    
    // Heuristics for common test locations
    const candidates = [
      path.join(dirname, `${basename}.test.ts`),
      path.join(dirname, `${basename}.test.js`),
      path.join(dirname, '__tests__', `${basename}.test.ts`),
      path.join(this.cwd, 'tests', `${basename}.test.ts`),
      path.join(this.cwd, 'test', `${basename}.test.ts`)
    ];

    for (const c of candidates) {
      // Logic would be to check fs.existsSync here
      // For this implementation, we just return the first that exists
      if (require('fs').existsSync(path.resolve(this.cwd, c))) {
        return c;
      }
    }

    return null;
  }
}
