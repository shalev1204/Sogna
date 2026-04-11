import { BaseGate } from './gates/BaseGate.js';
import { StaticAnalysisGate } from './gates/StaticAnalysisGate.js';
import { BlindReviewGate } from './gates/BlindReviewGate.js';
import { AntiSycophancyGate } from './gates/AntiSycophancyGate.js';
import { CompatibilityGate } from './gates/CompatibilityGate.js';
import { CouncilEvidence, GateResult } from './gates/types.js';
import chalk from 'chalk';

export class QualityCouncil {
  private gates: BaseGate[];

  constructor(private readonly cwd: string) {
    this.gates = [
      new CompatibilityGate(cwd),    // NEW: Gate 10 (High Priority)
      new StaticAnalysisGate(cwd),
      new BlindReviewGate(cwd),
      new AntiSycophancyGate(cwd)    // NEW: Gate 7
    ];
  }

  async evaluate(evidence: CouncilEvidence): Promise<{ passed: boolean; results: GateResult[] }> {
    console.log(chalk.bold(`\n${chalk.cyan('⚖️')} Quality Council Evaluation (Iteration ${evidence.iterationCount})`));
    console.log(chalk.dim(`  Mode: ${process.env.LOKI_QUALITY_TIER || 'Standard Assurance'}`));
    
    const results: GateResult[] = [];
    let allPassed = true;

    for (const gate of this.gates) {
      process.stdout.write(`  Running ${chalk.dim(gate.name)}... `);
      try {
        const result = await gate.run(evidence);
        results.push(result);

        if (result.status === 'PASS') {
          process.stdout.write(chalk.green('PASS\n'));
        } else {
          process.stdout.write(chalk.red('FAIL\n'));
          allPassed = false;
        }

        // Display findings for failed gates
        if (result.findings.length > 0) {
          result.findings.forEach(f => {
            const color = f.severity === 'CRITICAL' ? chalk.red : chalk.yellow;
            console.log(color(`    - [${f.severity}] ${f.message}`));
          });
        }
      } catch (error: any) {
        process.stdout.write(chalk.red('ERROR\n'));
        console.error(`    Error in gate ${gate.name}: ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log(chalk.bold.green('\n✔ Quality Council: All gates passed. Project is stable.'));
    } else {
      console.log(chalk.bold.red('\n✘ Quality Council: Verification failed. Corrections required.'));
    }

    return { passed: allPassed, results };
  }
}
