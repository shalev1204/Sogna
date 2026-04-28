import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AuditEntry, AuditFilter, AuditSummary } from './AuditTypes.js';

const MAX_MEMORY_ENTRIES = 1000;
const HASH_ALGO = 'sha256';

export class AuditLog {
  private readonly _logDir: string;
  private readonly _logFile: string;
  private _entries: AuditEntry[] = [];
  private _lastHash: string = 'GENESIS';
  private _entryCount: number = 0;
  public _chainCorrupted: boolean = false;

  constructor(opts?: { projectDir?: string; logDir?: string }) {
    const findSognatoreRoot = (start: string): string => {
      let curr = start;
      const root = path.parse(curr).root;
      while (curr !== root) {
        if (fs.existsSync(path.join(curr, 'resources')) && fs.existsSync(path.join(curr, 'package.json'))) {
          return curr;
        }
        curr = path.join(curr, '..');
      }
      return process.cwd();
    };

    const sognatoreRoot = opts?.projectDir || findSognatoreRoot(__dirname);
    this._logDir = opts?.logDir || path.join(sognatoreRoot, '.sognatore', 'audit');
    this._logFile = path.join(this._logDir, 'audit.jsonl');
    this._loadChainTip();
  }

  public record(entry: { who: string; what: string; where?: string; why?: string; metadata?: any }): AuditEntry {
    if (!entry || !entry.who || !entry.what) {
      throw new Error('Audit entry requires at least "who" and "what" fields');
    }

    const auditEntry: AuditEntry = {
      seq: this._entryCount,
      timestamp: new Date().toISOString(),
      who: String(entry.who),
      what: String(entry.what),
      where: entry.where ? String(entry.where) : null,
      why: entry.why ? String(entry.why) : null,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null,
      previousHash: this._lastHash,
      hash: null,
    };

    auditEntry.hash = this._computeHash(auditEntry);
    this._lastHash = auditEntry.hash;
    this._entryCount++;
    this._entries.push(auditEntry);

    if (this._entries.length >= MAX_MEMORY_ENTRIES) {
      this.flush();
    }

    return auditEntry;
  }

  public flush(): void {
    if (this._entries.length === 0) return;

    if (!fs.existsSync(this._logDir)) {
      fs.mkdirSync(this._logDir, { recursive: true });
    }

    const lines = this._entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    fs.appendFileSync(this._logFile, lines, 'utf8');
    this._entries = [];
  }

  public verifyChain(): { valid: boolean; entries: number; brokenAt: number | null; error: string | null } {
    this.flush();
    if (!fs.existsSync(this._logFile)) {
      return { valid: true, entries: 0, brokenAt: null, error: null };
    }

    const content = fs.readFileSync(this._logFile, 'utf8').trim();
    if (!content) {
      return { valid: true, entries: 0, brokenAt: null, error: null };
    }

    const lines = content.split('\n');
    let expectedPrevHash = 'GENESIS';
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      let entry: AuditEntry;
      try {
        entry = JSON.parse(lines[i]);
      } catch (e) {
        return { valid: false, entries: count, brokenAt: i, error: `Invalid JSON at line ${i}` };
      }

      if (entry.previousHash !== expectedPrevHash) {
        return { valid: false, entries: count, brokenAt: i, error: `Hash chain broken at entry ${i}` };
      }

      const computedHash = this._computeHash(entry);
      if (computedHash !== entry.hash) {
        return { valid: false, entries: count, brokenAt: i, error: `Hash mismatch at entry ${i}: entry has been tampered with` };
      }

      expectedPrevHash = entry.hash || '';
      count++;
    }

    return { valid: true, entries: count, brokenAt: null, error: null };
  }

  public readEntries(filter?: AuditFilter): AuditEntry[] {
    this.flush();
    if (!fs.existsSync(this._logFile)) return [];

    const content = fs.readFileSync(this._logFile, 'utf8').trim();
    if (!content) return [];

    let entries = content.split('\n').map((line) => {
      try {
        return JSON.parse(line) as AuditEntry;
      } catch (_) {
        return null;
      }
    }).filter((e): e is AuditEntry => e !== null);

    if (filter) {
      if (filter.who) entries = entries.filter((e) => e.who === filter.who);
      if (filter.what) entries = entries.filter((e) => e.what === filter.what);
      if (filter.since) entries = entries.filter((e) => e.timestamp >= filter.since!);
      if (filter.until) entries = entries.filter((e) => e.timestamp <= filter.until!);
    }

    return entries;
  }

  public getSummary(): AuditSummary {
    const entries = this.readEntries();
    const actors: Set<string> = new Set();
    const actions: Set<string> = new Set();

    for (const entry of entries) {
      actors.add(entry.who);
      actions.add(entry.what);
    }

    return {
      totalEntries: entries.length,
      actors: Array.from(actors),
      actions: Array.from(actions),
      firstEntry: entries.length > 0 ? entries[0].timestamp : null,
      lastEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
    };
  }

  public destroy(): void {
    this.flush();
    this._entries = [];
  }

  private _computeHash(entry: AuditEntry): string {
    const data = JSON.stringify({
      seq: entry.seq,
      timestamp: entry.timestamp,
      who: entry.who,
      what: entry.what,
      where: entry.where,
      why: entry.why,
      metadata: entry.metadata,
      previousHash: entry.previousHash,
    });
    return crypto.createHash(HASH_ALGO).update(data).digest('hex');
  }

  private _loadChainTip(): void {
    if (!fs.existsSync(this._logFile)) return;
    try {
      const content = fs.readFileSync(this._logFile, 'utf8').trim();
      if (!content) return;
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 1];
      const lastEntry = JSON.parse(lastLine) as AuditEntry;
      this._lastHash = lastEntry.hash || 'GENESIS';
      this._entryCount = (lastEntry.seq ?? 0) + 1;
    } catch (_) {
      console.warn('[audit] Warning: corrupted chain tip detected, starting fresh chain');
      this._chainCorrupted = true;
    }
  }
}
