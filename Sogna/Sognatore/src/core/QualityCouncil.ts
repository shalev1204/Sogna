import { BaseGate } from './gates/basegate.js';
import { StaticAnalysisGate } from './gates/staticanalysisgate.js';
import { BlindReviewGate } from './gates/blindreviewgate.js';
import { AntiSycophancyGate } from './gates/antisycophancygate.js';
import { CompatibilityGate } from './gates/compatibilitygate.js';
import { ConsensusGate } from './gates/consensusgate.js';
import { VitalsGate } from './gates/vitalsgate.js';
import { AdversarialGate } from './gates/adversarialgate.js';
import { CouncilEvidence, GateResult } from './gates/types.js';
import { AgentRegistry } from './agents/agentregistry.js';
import chalk from 'chalk';

export class QualityCouncil {
  private gates: BaseGate[];

  constructor(private readonly cwd: string) {
    this.gates = [
      new VitalsGate(cwd),           // INSTITUTIONAL PRE-FLIGHT
      new CompatibilityGate(cwd),    // GATE 10 (High Priority)
      new ConsensusGate(cwd),        // SBP Bridge
      new StaticAnalysisGate(cwd),
      new AdversarialGate(cwd),      // PREDATORE STRESS TEST
      new BlindReviewGate(cwd),
      new AntiSycophancyGate(cwd)    // GATE 7
    ];
  }

  async evaluate(evidence: CouncilEvidence): Promise<{ passed: boolean; results: GateResult[] }> {
    console.log(chalk.bold(`\n${chalk.cyan('⚖️')} Quality Council Evaluation (Iteration ${evidence.iterationCount})`));
    console.log(chalk.dim(`  Mode: ${process.env.SOGNATORE_QUALITY_TIER || 'Standard Assurance'}`));
    
    const results: GateResult[] = [];
    let allPassed = true;

    for (const gate of this.gates) {
      process.stdout.write(`  Running ${chalk.dim(gate.name)}... `);
      try {
        let result = await gate.run(evidence);

        if (result.status !== 'PASS' && evidence.isCritical) {
          process.stdout.write(chalk.yellow('WAIT (Initiating Consensus Debate)...\n'));
          const debateResult = await this.triggerDebate(gate, result, evidence);
          if (debateResult.resolved) {
            console.log(chalk.green(`    ✓ Debate Consensus: ${debateResult.reason}`));
            result = { ...result, status: 'PASS', findings: [] }; // Override with consensus
          }
        }

        results.push(result);

        if (result.status === 'PASS') {
          process.stdout.write(chalk.green('PASS\n'));
        } else {
          process.stdout.write(chalk.red('FAIL\n'));
          allPassed = false;
        }

        // Display findings for failed gates
        if (result.findings.length > 0) {
          result.findings.forEach((f: any) => {
            const color = f.severity === 'CRITICAL' ? chalk.red : chalk.yellow;
            console.log(color(`    - [${f.severity}] ${f.message}`));
          });
        }
      } catch (error: unknown) {
        process.stdout.write(chalk.red('ERROR\n'));
        const message = error instanceof Error ? error.message : String(error);
        console.error(`    Error in gate ${gate.name}: ${message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log(chalk.bold.green('\n✔ Quality Council: All gates passed (or resolved by consensus).'));
    } else {
      console.log(chalk.bold.red('\n✘ Quality Council: Verification failed. Corrections required.'));
    }

    return { passed: allPassed, results };
  }

  /**
   * Institutional Consensus Debate Protocol.
   * Spawns two agents with opposing roles to resolve a validation conflict.
   */
  private async triggerDebate(gate: BaseGate, failedResult: GateResult, evidence: CouncilEvidence): Promise<{ resolved: boolean; reason: string }> {
    console.log(chalk.bold.magenta('  [CONCENSUS_DEBATE] Spawning Dialectic Peer Review...'));

    const registry = AgentRegistry.getInstance();
    const architect = await registry.getAgent('prod-design'); // Representative for Architecture
    const auditor = await registry.getAgent('supervisor');    // Representative for Quality Audit

    const debateContext = `
    TASK UNDER REVIEW: ${evidence.actionPlan || 'No plan provided'}
    FAILED GATE: ${gate.name}
    FINDINGS:
    ${failedResult.findings.map((f: any) => `- [${f.severity}] ${f.message}`).join('\n')}
    
    INSTRUCTIONS:
    Architect: Defend the plan or propose a fix.
    Auditor: Challenge the plan and ensure 100% compliance.
    
    GOAL: Reach a consensus if the plan is safe and high-quality.
    `.trim();

    try {
      // Turn 1: Architect Proposal
      const architectResponse = await architect.runTask(`Analyze the failure and justify or fix it:\n${debateContext}`);
      
      // Turn 2: Auditor Challenge
      const auditorResponse = await auditor.runTask(`Critique the architect's defense and decide if it's safe to proceed:\n${architectResponse}\n\nOriginal Findings:\n${debateContext}`);

      const resolved = auditorResponse.toUpperCase().includes('RESOLVED') || auditorResponse.toUpperCase().includes('APPROVED');
      
      return { 
        resolved, 
        reason: resolved ? 'Debate concluded: Security and Architecture reconciled.' : 'Debate failed: No consensus reached.'
      };
    } catch (e) {
      console.error(chalk.red(`    [DEBATE_ERROR] Dialectic loop failed: ${e}`));
      return { resolved: false, reason: 'Debate system error.' };
    }
  }
}
