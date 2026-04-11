import { BaseGate } from './BaseGate.js';
import { GateResult, CouncilEvidence } from './types.js';
import { execa } from 'execa';

export class StaticAnalysisGate extends BaseGate {
  get id() { return 'QG-002'; }
  get name() { return 'Static Analysis'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const findings: any[] = [];
    
    // Check for ESLint
    if (await this.toolResolver.isAvailable('eslint')) {
      try {
        const resolved = this.toolResolver.resolve('eslint');
        await execa(resolved, ['.', '--ext', '.ts,.js'], { cwd: this.cwd });
      } catch (error: any) {
        findings.push({
          severity: 'HIGH',
          message: `Linting failed: ${error.stdout || error.message}`
        });
      }
    }

    // Check for Type Checking (TSC)
    if (await this.toolResolver.isAvailable('tsc')) {
      try {
        const resolved = this.toolResolver.resolve('tsc');
        await execa(resolved, ['--noEmit'], { cwd: this.cwd });
      } catch (error: any) {
        findings.push({
          severity: 'CRITICAL',
          message: `Type check failed: ${error.stdout || error.message}`
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
}
