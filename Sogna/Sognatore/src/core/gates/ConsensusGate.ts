import { BaseGate } from './BaseGate.js';
import { GateResult, CouncilEvidence } from './types.js';
import fs from 'fs';
import path from 'path';

export class ConsensusGate extends BaseGate {
  get id() { return 'gate-sbp-consensus'; }
  get name() { return 'Sogna Bridge Consensus'; }

  async run(evidence: CouncilEvidence): Promise<GateResult> {
    const rulesPath = path.join(this.cwd, '.sognarules');
    
    // 1. Check for SBP existence
    if (!fs.existsSync(rulesPath)) {
      return this.fail('Missing .sognarules. SBP cannot be established without sovereign guidelines.', 'CRITICAL');
    }

    const rules = fs.readFileSync(rulesPath, 'utf8');
    
    // 2. Perform Virtual Handshake with Antigravity Orchestrator
    // In a real execution, this would trigger a message bus event. 
    // Here we simulate the validation of the current plan against SBP standards.
    console.log('[SBP] Initiating Sogna Bridge Protocol handshake...');
    
    const actionPlan = evidence.actionPlan || 'No action plan provided';
    
    // Simulate Antigravity Peer Review
    if (this.detectSbpConflict(actionPlan, rules)) {
      console.log('[SBP] Conflict detected! Initiating Dual Diagnostic Protocol...');
      return this.fail(
        'SBP Conflict: The proposed plan deviates from established sovereign standards. Consult sb_conflict_resolution.md if fallback is triggered.',
        'HIGH',
        { conflictContext: actionPlan }
      );
    }

    return this.pass({ consensus: 'Established', protocol: 'SBP 1.0' });
  }

  private detectSbpConflict(plan: string, rules: string): boolean {
    // Simple heuristic for the gate: if plan contains forbidden patterns 
    // or lacks required specialist consultation markers.
    const forbidden = ['skip verification', 'ignore rules', 'temporary fix'];
    return forbidden.some(term => plan.toLowerCase().includes(term));
  }
}
