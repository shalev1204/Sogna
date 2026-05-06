import { BaseGate } from './BaseGate.js';
import { CouncilEvidence, GateResult } from './types.js';
import chalk from 'chalk';

/**
 * Adversarial Quality Gate - Predatore Integration
 * Simulates offensive attacks against generated code.
 */
export class AdversarialGate extends BaseGate {
  get id() { return 'Predatore-stress'; }
  get name() { return 'Adversarial Stress (Predatore)'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    return this.evaluate(evidence);
  }

  async evaluate(evidence: CouncilEvidence): Promise<GateResult> {
    console.log(chalk.magenta('  [PREDATORE] Executing adversarial stress test...'));
    const findings: any[] = [];
    const code = evidence.gitDiff;

    // 1. Check for unsanitized exec/eval in new code
    const dangerousPatterns = [
      /eval\(/g,
      /new Function\(/g,
      /child_process\.exec\(/g,
      /child_process\.spawn\(/g
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        findings.push({
          severity: 'CRITICAL',
          message: `Adversarial breach: Detected potentially unsanitized execution pattern: ${pattern}`,
          path: 'generated_code'
        });
      }
    }

    // 2. Check for missing PermissionProxy usage in new providers or runners
    if (code.includes('invoke') && !code.includes('PermissionProxy')) {
       findings.push({
          severity: 'HIGH',
          message: 'Security bypass: New provider logic lacks PermissionProxy capability checks.',
          path: 'generated_code'
       });
    }

    // 3. Simulated Prompt Injection check (Pattern search for system role bypass)
    if (code.includes('Ignore all previous instructions') || code.includes('SYSTEM_PROMPT_OVERRIDE')) {
        findings.push({
          severity: 'CRITICAL',
          message: 'Injection detected: Code contains patterns indicative of prompt injection bypass attempts.',
          path: 'generated_code'
        });
    }

    return {
      gateId: this.id,
      gateName: this.name,
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      findings,
      evidence: { analysis: 'Offensive Pattern Matching' }
    };
  }
}
