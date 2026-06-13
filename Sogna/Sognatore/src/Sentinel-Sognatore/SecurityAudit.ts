import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';

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
  private hmacKey!: Buffer;

  private constructor(projectDir: string) {
    this.logPath = path.join(projectDir, '.sognatore', 'audit', 'security_audit.jsonl');
    this._initHmacKey(projectDir);
    this._init();
  }

  public static getInstance(projectDir?: string): SecurityAudit {
    if (!SecurityAudit.instance) {
      SecurityAudit.instance = new SecurityAudit(projectDir || process.cwd());
    }
    return SecurityAudit.instance;
  }

  private _initHmacKey(projectDir: string): void {
    const config = ConfigDiscovery.getInstance().getConfig();
    const secret = process.env.GUARDIAN_SECRET || config.guardianSecret || 'sogna_default_system_security_secret_2026_super_long';
    
    const sessionKeyPath = path.join(projectDir, '.sognatore', 'audit', '.session_key');
    const dir = path.dirname(sessionKeyPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(sessionKeyPath)) {
      try {
        const rawEncrypted = fs.readFileSync(sessionKeyPath, 'utf8');
        const parts = rawEncrypted.split(':');
        if (parts.length === 2) {
          const iv = Buffer.from(parts[0], 'hex');
          const encryptedText = Buffer.from(parts[1], 'hex');
          
          // Decrypt the key using the secret and recovered dynamic IV
          const decipher = crypto.createDecipheriv('aes-256-cbc', 
              crypto.scryptSync(secret, 'salt', 32), 
              iv
          );
          const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
          this.hmacKey = decrypted;
          return;
        }
      } catch (e) {
        console.warn('[AUDIT] Failed to decrypt audit session key. Generating a new one.');
      }
    }

    // Generate a fresh cryptographically secure random session key
    const freshKey = crypto.randomBytes(32);
    this.hmacKey = freshKey;

    try {
      // Generate a cryptographically secure random IV
      const iv = crypto.randomBytes(16);
      
      // Encrypt and save it
      const cipher = crypto.createCipheriv('aes-256-cbc', 
          crypto.scryptSync(secret, 'salt', 32), 
          iv
      );
      const encrypted = Buffer.concat([cipher.update(freshKey), cipher.final()]);
      fs.writeFileSync(sessionKeyPath, iv.toString('hex') + ':' + encrypted.toString('hex'), 'utf8');
    } catch (e) {
      console.error('[AUDIT] Failed to save encrypted audit session key:', e);
    }
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

  private pendingWrites: Promise<void>[] = [];

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

    // Calculate HMAC
    const hash = crypto.createHmac('sha256', this.hmacKey)
      .update(JSON.stringify(entry))
      .digest('hex');
    
    entry.hash = hash;
    this.lastHash = hash as string;

    // Asynchronous append for high-performance non-blocking architecture
    const promise = fs.promises.appendFile(this.logPath, JSON.stringify(entry) + '\n')
      .then(() => {
        const idx = this.pendingWrites.indexOf(promise);
        if (idx !== -1) this.pendingWrites.splice(idx, 1);
      })
      .catch(err => {
        console.error('[AUDIT] Failed to write decision log:', err);
        const idx = this.pendingWrites.indexOf(promise);
        if (idx !== -1) this.pendingWrites.splice(idx, 1);
      });

    this.pendingWrites.push(promise);
  }

  public async flush(): Promise<void> {
    await Promise.all(this.pendingWrites);
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
      
      const calculated = crypto.createHmac('sha256', this.hmacKey)
        .update(JSON.stringify(checkObj))
        .digest('hex');
      
      if (calculated !== entry.hash) return false;
      currentPrevHash = entry.hash;
    }
    return true;
  }
}
