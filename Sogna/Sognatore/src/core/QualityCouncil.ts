import { Color } from '@Sogna/Curator';
import { BaseGate } from './gates/BaseGate.js';
import { StaticAnalysisGate } from './gates/StaticAnalysisGate.js';
import { BlindReviewGate } from './gates/BlindReviewGate.js';
import { AntiSycophancyGate } from './gates/AntiSycophancyGate.js';
import { CompatibilityGate } from './gates/CompatibilityGate.js';
import { ConsensusGate } from './gates/ConsensusGate.js';
import { VitalsGate } from './gates/VitalsGate.js';
import { AdversarialGate } from './gates/AdversarialGate.js';
import { CouncilEvidence, GateResult } from './gates/types.js';
import { AgentRegistry } from './agents/AgentRegistry.js';


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
    console.log(Color.bold(`\n${Color.cyan('⚖️')} Quality Council Evaluation (Iteration ${evidence.iterationCount})`));
    console.log(Color.dim(`  Mode: ${process.env.SOGNATORE_QUALITY_TIER || 'Standard Assurance'}`));
    
    const results: GateResult[] = [];
    let allPassed = true;

    for (const gate of this.gates) {
      process.stdout.write(`  Running ${Color.dim(gate.name)}... `);
      try {
        let result = await gate.run(evidence);

        if (result.status !== 'PASS' && evidence.isCritical) {
          process.stdout.write(Color.yellow('WAIT (Initiating Consensus Debate)...\n'));
          const debateResult = await this.triggerDebate(gate, result, evidence);
          if (debateResult.resolved) {
            console.log(Color.green(`    ✓ Debate Consensus: ${debateResult.reason}`));
            result = { ...result, status: 'PASS', findings: [] }; // Override with consensus
          }
        }

        results.push(result);

        if (result.status === 'PASS') {
          process.stdout.write(Color.green('PASS\n'));
        } else {
          process.stdout.write(Color.red('FAIL\n'));
          allPassed = false;
        }

        // Display findings for failed gates
        if (result.findings.length > 0) {
          result.findings.forEach((f: any) => {
            const color = f.severity === 'CRITICAL' ? Color.red : Color.yellow;
            console.log(color(`    - [${f.severity}] ${f.message}`));
          });
        }
      } catch (error: unknown) {
        process.stdout.write(Color.red('ERROR\n'));
        const message = error instanceof Error ? error.message : String(error);
        console.error(`    Error in gate ${gate.name}: ${message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log(Color.bold.green('\n✔ Quality Council: All gates passed (or resolved by consensus).'));
    } else {
      console.log(Color.bold.red('\n✘ Quality Council: Verification failed. Corrections required.'));
    }

    return { passed: allPassed, results };
  }

  /**
   * Institutional Consensus Debate Protocol.
   * Spawns two agents with opposing roles to resolve a validation conflict.
   */
  private async triggerDebate(gate: BaseGate, failedResult: GateResult, evidence: CouncilEvidence): Promise<{ resolved: boolean; reason: string }> {
    console.log(Color.bold.magenta('  [CONCENSUS_DEBATE] Spawning Dialectic Peer Review...'));

    const registry = AgentRegistry.getInstance();
    const architect = await registry.getAgent('prod-design'); // Representative for Architecture
    const predatore = await registry.getAgent('supervisor');    // Representative for Quality Audit

    const debateContext = `
    TASK UNDER REVIEW: ${evidence.actionPlan || 'No plan provided'}
    FAILED GATE: ${gate.name}
    FINDINGS:
    ${failedResult.findings.map((f: any) => `- [${f.severity}] ${f.message}`).join('\n')}
    
    INSTRUCTIONS:
    Architect: Defend the plan or propose a fix.
    Predatore: Challenge the plan and ensure 100% compliance.
    
    GOAL: Reach a consensus if the plan is safe and high-quality.
    `.trim();

    try {
      // Turn 1: Architect Proposal
      const architectResponse = await architect.runTask(`Analyze the failure and justify or fix it:\n${debateContext}`);
      
      // Turn 2: Predatore Challenge
      const predatoreResponse = await predatore.runTask(`Critique the architect's defense and decide if it's safe to proceed:\n${architectResponse}\n\nOriginal Findings:\n${debateContext}`);

      const resolved = predatoreResponse.toUpperCase().includes('RESOLVED') || predatoreResponse.toUpperCase().includes('APPROVED');
      
      return { 
        resolved, 
        reason: resolved ? 'Debate concluded: Security and Architecture reconciled.' : 'Debate failed: No consensus reached.'
      };
    } catch (e) {
      console.error(Color.red(`    [DEBATE_ERROR] Dialectic loop failed: ${e}`));
      return { resolved: false, reason: 'Debate system error.' };
    }
  }
}
