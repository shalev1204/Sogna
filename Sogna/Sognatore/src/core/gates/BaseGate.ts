import { GateResult, CouncilEvidence } from './types.js';
import { ToolResolver } from '../ToolResolver.js';

export abstract class BaseGate {
  protected toolResolver: ToolResolver;

  constructor(protected readonly cwd: string) {
    this.toolResolver = new ToolResolver(cwd);
  }

  abstract get id(): string;
  abstract get name(): string;

  /**
   * Main execution point for the gate.
   */
  abstract run(evidence: CouncilEvidence): Promise<GateResult>;

  /**
   * Helper to format a quick pass result.
   */
  protected pass(evidence?: unknown): GateResult {
    return {
      gateId: this.id,
      gateName: this.name,
      status: 'PASS',
      findings: [],
      evidence
    };
  }

  /**
   * Helper to format a fail result.
   */
  protected fail(message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH', evidence?: unknown): GateResult {
    return {
      gateId: this.id,
      gateName: this.name,
      status: 'FAIL',
      findings: [{ severity, message }],
      evidence
    };
  }
}
