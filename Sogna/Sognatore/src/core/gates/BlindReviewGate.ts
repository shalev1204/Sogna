import { BaseGate } from './BaseGate.js';
import { GateResult, CouncilEvidence } from './types.js';
import { ProviderFactory } from '../ProviderFactory.js';

export class BlindReviewGate extends BaseGate {
  get id() { return 'QG-003'; }
  get name() { return 'Blind Review System'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const provider = ProviderFactory.getProvider(); // Get current default provider
    
    const roles = [
      {
        id: 'requirements',
        role: 'REQUIREMENTS VERIFIER',
        instruction: 'Check if every requirement from the PRD has been implemented. Look for missing features, incomplete implementations, and unmet acceptance criteria.'
      },
      {
        id: 'tests',
        role: 'TEST PREDATORE',
        instruction: 'Verify that adequate tests exist and pass. Check test coverage, edge cases, error handling.'
      },
      {
        id: 'advocate',
        role: 'DEVILS ADVOCATE',
        instruction: 'Find reasons the project is NOT complete. Look for: missing error handling, security issues, performance problems, TODO comments.'
      }
    ];

    const promptBase = `You are a council member reviewing project completion. 
${evidence.gitDiff ? `DIFF:\n${evidence.gitDiff}` : 'No code changes available.'}
${evidence.prdPath ? `PRD: ${evidence.prdPath}` : 'No PRD available.'}
`;

    const results = await Promise.all(roles.map(async (r) => {
      const prompt = `${promptBase}\n\nROLE: ${r.role}\n${r.instruction}\n\nResponse format:\nVOTE: APPROVE or REJECT\nREASON: [reason]`;
      try {
        const response = await provider.invoke(prompt, { tier: 'fast' });
        const voteMatch = response.match(/VOTE:\s*(APPROVE|REJECT)/i);
        const reasonMatch = response.match(/REASON:\s*(.*)/i);
        
        return {
          role: r.id,
          vote: voteMatch ? voteMatch[1].toUpperCase() : 'REJECT',
          reason: reasonMatch ? reasonMatch[1] : 'No reason provided.'
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { role: r.id, vote: 'REJECT', reason: `Error: ${message}` };
      }
    }));

    const approveCount = results.filter(r => r.vote === 'APPROVE').length;
    const findings = results.filter(r => r.vote === 'REJECT').map(r => ({
      severity: 'HIGH' as const,
      message: `${r.role}: ${r.reason}`
    }));

    return {
      gateId: this.id,
      gateName: this.name,
      status: approveCount >= 2 ? 'PASS' : 'FAIL',
      findings,
      evidence: results
    };
  }
}
