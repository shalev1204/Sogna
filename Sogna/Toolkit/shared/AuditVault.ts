import fs from 'fs';
import path from 'path';

export interface AuditEvent {
  timestamp: string;
  agentId?: string;
  type: 'TOOL_CALL' | 'REASONING' | 'SECURITY' | 'COST' | 'ERROR' | 'ORCHESTRATION';
  action: string;
  metadata: Record<string, any>;
  summary: string;
}

/**
 * AuditVault: A high-performance, lightweight telemetry sink for institutional auditing.
 * It strictly follows a "No-Sensitive-Data" policy, storing only metadata and summaries.
 */
export class AuditVault {
  private static instance: AuditVault;
  private auditDir: string;
  private auditFile: string;

  private constructor() {
    this.auditDir = path.join(process.cwd(), '.sognare', 'audit');
    this.auditFile = path.join(this.auditDir, 'audit.jsonl');
    
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  public static getInstance(): AuditVault {
    if (!this.instance) {
      this.instance = new AuditVault();
    }
    return this.instance;
  }

  /**
   * Records a lightweight audit event.
   */
  public record(event: Omit<AuditEvent, 'timestamp'>): void {
    const fullEvent: AuditEvent = {
      timestamp: new Date().toISOString(),
      ...event
    };

    try {
      // Append to JSONL for high performance and streamability
      fs.appendFileSync(this.auditFile, JSON.stringify(fullEvent) + '\n');
    } catch (error) {
      console.error(`[AUDIT-VAULT] Failed to record event:`, error);
    }
  }

  /**
   * Helper to record tool execution metrics.
   */
  public recordTool(agentId: string, tool: string, status: 'START' | 'END' | 'ERROR', durationMs?: number, metadata: Record<string, any> = {}) {
    this.record({
      agentId,
      type: 'TOOL_CALL',
      action: tool,
      summary: `Tool ${tool} ${status.toLowerCase()}${durationMs ? ` in ${durationMs}ms` : ''}`,
      metadata: { status, durationMs, ...metadata }
    });
  }

  /**
   * Helper to record agent "Internal Thoughts" summary.
   */
  public recordReasoning(agentId: string, turn: number, thoughtSummary: string) {
    this.record({
      agentId,
      type: 'REASONING',
      action: `TURN_${turn}`,
      summary: thoughtSummary,
      metadata: { turn }
    });
  }
}
