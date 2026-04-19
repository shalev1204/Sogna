import fs from 'fs';
import path from 'path';
/**
 * AuditVault: A high-performance, lightweight telemetry sink for institutional auditing.
 * It strictly follows a "No-Sensitive-Data" policy, storing only metadata and summaries.
 */
export class AuditVault {
    static instance;
    auditDir;
    auditFile;
    constructor() {
        this.auditDir = path.join(process.cwd(), '.sognare', 'audit');
        this.auditFile = path.join(this.auditDir, 'audit.jsonl');
        if (!fs.existsSync(this.auditDir)) {
            fs.mkdirSync(this.auditDir, { recursive: true });
        }
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new AuditVault();
        }
        return this.instance;
    }
    /**
     * Records a lightweight audit event.
     */
    record(event) {
        const fullEvent = {
            timestamp: new Date().toISOString(),
            ...event
        };
        try {
            // Append to JSONL for high performance and streamability
            fs.appendFileSync(this.auditFile, JSON.stringify(fullEvent) + '\n');
        }
        catch (error) {
            console.error(`[AUDIT-VAULT] Failed to record event:`, error);
        }
    }
    /**
     * Helper to record tool execution metrics.
     */
    recordTool(agentId, tool, status, durationMs, metadata = {}) {
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
    recordReasoning(agentId, turn, thoughtSummary) {
        this.record({
            agentId,
            type: 'REASONING',
            action: `TURN_${turn}`,
            summary: thoughtSummary,
            metadata: { turn }
        });
    }
}
