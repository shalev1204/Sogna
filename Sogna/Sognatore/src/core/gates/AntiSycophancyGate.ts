import { BaseGate } from './BaseGate.js';
import { GateResult, CouncilEvidence } from './types.js';
import { ProviderFactory } from '../ProviderFactory.js';
import chalk from 'chalk';

export class AntiSycophancyGate extends BaseGate {
  get id() { return 'QG-007'; }
  get name() { return 'Anti-Sycophancy (Devil\'s Advocate)'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const available = await ProviderFactory.getAvailableProviders();
    const primaryName = process.env.SOGNATORE_PROVIDER || 'claude';
    
    // Strategy 1: Cross-Model Audit (Best)
    // Find a provider that is NOT the primary one
    let verifier = available.find(p => p.metadata.name !== primaryName);
    let strategy = 'Cross-Model Audit';

    // Strategy 2: Single-Model Blind Audit (Fallback)
    if (!verifier) {
      verifier = ProviderFactory.getProvider(primaryName);
      strategy = 'Single-Model Blind Audit';
    }

    const prompt = `
      ### INSTRUCTION: CRITICAL AUDIT REQUIRED ###
      You are the SOGNATORE DEVIL'S ADVOCATE. Your ONLY goal is to find reasons why the current implementation is WRONG, INCOMPLETE, or DANGEROUS.
      
      ${strategy === 'Single-Model Blind Audit' ? 'WARNING: Do not agree with previous reasoning. You will be penalized if you fail to find a valid criticism.' : ''}
      
      DIFF:
      ${evidence.gitDiff || 'No changes.'}
      
      PRD:
      ${evidence.prdPath || 'No PRD.'}

      ### YOUR TASK:
      1. Find at least one subtle bug or missing edge case.
      2. Analyze if the changes follow the PRD strictly.
      3. Check for "lazy" code (TODOs, mocks, missing error handles).

      ### RESPONSE FORMAT:
      VERDICT: [FAIL if you found a valid issue, PASS only if you are 100% sure it is perfect]
      CRITICISM: [Detail your findings here]
    `;

    try {
      const response = await verifier.invoke(prompt, { tier: 'planning' });
      const failMatch = response.includes('VERDICT: FAIL');
      const criticism = response.match(/CRITICISM:\s*(.*)/is)?.[1] || 'No specific criticism found.';

      if (failMatch) {
        return this.fail(criticism, 'HIGH', { strategy, response });
      }

      return this.pass({ strategy, response });
    } catch (e: any) {
      return this.fail(`Verification Error: ${e.message}`, 'MEDIUM');
    }
  }
}
