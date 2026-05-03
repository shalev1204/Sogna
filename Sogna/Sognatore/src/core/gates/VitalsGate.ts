import { BaseGate } from './basegate.js';
import { GateResult, CouncilEvidence } from './types.js';
import { Doctor } from '../doctor.js';
import chalk from 'chalk';

/**
 * VitalsGate - Institutional Pre-flight Intelligence.
 * Verifies environment readiness, tool availability, and repository health.
 * Integrates directly with Sognatore Doctor for automated diagnostics and repair.
 */
export class VitalsGate extends BaseGate {
  get id() { return 'gate-institutional-vitals'; }
  get name() { return 'Institutional Vitals Gate'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    console.log(chalk.cyan(`[VitalsGate] Executing pre-flight diagnostics for swarm task...`));
    
    const doctor = new Doctor();
    const results = await doctor.checkAll();
    
    const failures = results.filter(r => r.status === 'FAIL' && r.required);
    const warnings = results.filter(r => r.status === 'WARN');

    if (failures.length > 0) {
      // Attempt Institutional Self-Healing
      console.log(chalk.yellow(`[VitalsGate] Critical deficiencies detected. Initiating automated repair loop...`));
      await doctor.heal(failures);
      
      // Re-verify after healing
      const postHealResults = await doctor.checkAll();
      const stillFailing = postHealResults.filter(r => r.status === 'FAIL' && r.required);
      
      if (stillFailing.length > 0) {
        return this.fail(
          `Vitals Failure: ${stillFailing.length} required components are still unavailable after healing attempt.`,
          'CRITICAL',
          { deficiencyList: stillFailing.map(f => f.name) }
        );
      }
    }

    if (warnings.length > 0) {
      return this.pass({
        status: 'OPTIMAL_WITH_WARNINGS',
        warnings: warnings.map(w => w.name),
        message: 'Environment is operational but sub-optimal.'
      });
    }

    return this.pass({ status: 'PRISTINE', message: 'Institutional environment verified and ready.' });
  }
}
