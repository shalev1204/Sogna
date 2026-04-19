export type GateSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type GateStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIPPED';

export interface GateFinding {
  severity: GateSeverity;
  message: string;
  file?: string;
  line?: number;
}

export interface GateResult {
  gateId: string;
  gateName: string;
  status: GateStatus;
  findings: GateFinding[];
  evidence?: unknown;
}

export interface CouncilEvidence {
  prdPath?: string;
  gitDiff?: string;
  testLogs?: string[];
  buildLog?: string;
  iterationCount: number;
  actionPlan?: string;
  isCritical?: boolean;
}
