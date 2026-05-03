import { BaseGate } from './basegate.js';
import { GateResult, CouncilEvidence, type GateFinding } from './types.js';
import { execa, type ExecaError } from 'execa';

export class StaticAnalysisGate extends BaseGate {
  get id() { return 'QG-002'; }
  get name() { return 'Static Analysis'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const findings: GateFinding[] = [];
    
    // Check for ESLint
    if (await this.toolResolver.isAvailable('eslint')) {
      try {
        const resolved = this.toolResolver.resolve('eslint');
        await execa(resolved, ['.', '--ext', '.ts,.js'], { cwd: this.cwd });
      } catch (error: unknown) {
        const err = error as ExecaError;
        findings.push({
          severity: 'HIGH',
          message: `Linting failed: ${err.stdout || err.message}`
        });
      }
    }

    // Check for Type Checking (TSC)
    if (await this.toolResolver.isAvailable('tsc')) {
      try {
        const resolved = this.toolResolver.resolve('tsc');
        await execa(resolved, ['--noEmit'], { cwd: this.cwd });
      } catch (error: unknown) {
        const err = error as ExecaError;
        findings.push({
          severity: 'CRITICAL',
          message: `Type check failed: ${err.stdout || err.message}`
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
