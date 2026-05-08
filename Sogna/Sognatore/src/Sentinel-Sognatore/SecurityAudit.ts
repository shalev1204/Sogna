import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuditEntry {
  timestamp: string;
  enforcementPoint: string;
  decision: string;
  reason: string;
  context: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

/**
 * SecurityAudit - Ensures immutable logging of all Sentinel security decisions.
 */
export class SecurityAudit {
  private static instance: SecurityAudit;
  private logPath: string;
  private lastHash: string = 'GENESIS_BLOCK';

  private constructor(projectDir: string) {
    this.logPath = path.join(projectDir, '.sognatore', 'audit', 'security_audit.jsonl');
    this._init();
  }

  public static getInstance(projectDir?: string): SecurityAudit {
    if (!SecurityAudit.instance) {
      SecurityAudit.instance = new SecurityAudit(projectDir || process.cwd());
    }
    return SecurityAudit.instance;
  }

  private _init(): void {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Attempt to recover last hash from existing log
    if (fs.existsSync(this.logPath)) {
      try {
        const lines = fs.readFileSync(this.logPath, 'utf8').trim().split('\n');
        if (lines.length > 0) {
          const lastEntry = JSON.parse(lines[lines.length - 1]);
          this.lastHash = lastEntry.hash;
        }
      } catch (e) {
        console.warn('[AUDIT] Failed to recover audit chain. Starting new hash sequence.');
      }
    }
  }

  /**
   * Records a security decision with a cryptographic signature chain.
   */
  public logDecision(enforcementPoint: string, decision: string, reason: string, context: Record<string, unknown>): void {
    const entry: Partial<AuditEntry> = {
      timestamp: new Date().toISOString(),
      enforcementPoint,
      decision,
      reason,
      context,
      previousHash: this.lastHash
    };

    // Calculate Hash
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(entry))
      .digest('hex');
    
    entry.hash = hash;
    this.lastHash = hash as string;

    // Asynchronous append for high-performance non-blocking architecture
    fs.promises.appendFile(this.logPath, JSON.stringify(entry) + '\n').catch(err => {
      console.error('[AUDIT] Failed to write decision log:', err);
    });
  }

  public verifyChain(): boolean {
    if (!fs.existsSync(this.logPath)) return true;
    
    const lines = fs.readFileSync(this.logPath, 'utf8').trim().split('\n');
    let currentPrevHash = 'GENESIS_BLOCK';

    for (const line of lines) {
      if (!line) continue;
      const entry: AuditEntry = JSON.parse(line);
      
      if (entry.previousHash !== currentPrevHash) return false;
      
      const checkObj = { ...entry };
      delete (checkObj as any).hash;
      
      const calculated = crypto.createHash('sha256')
        .update(JSON.stringify(checkObj))
        .digest('hex');
      
      if (calculated !== entry.hash) return false;
      currentPrevHash = entry.hash;
    }
    return true;
  }
}
