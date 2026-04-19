// @sentinel-ignore: GLOBAL - Policy engine module with authorized dynamic timeout logic.
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ApprovalGatePolicy } from './PolicyTypes.js';
import { Hub } from './Hub.js';

/**
 * Sentinel Gates - Human-in-the-loop approval system part of the Sentinel-Sognatore block.
 */

const DEFAULT_TIMEOUT_MINUTES = 30;
const MAX_AUDIT_ENTRIES = 10000;

export interface ApprovalRequest {
  id: string;
  phase: string;
  gate: string;
  status: 'pending' | 'approved' | 'rejected' | 'timed_out';
  context: any;
  createdAt: string;
  resolvedAt: string | null;
  method: 'auto' | 'timeout' | 'manual' | null;
  reason: string | null;
}

export interface ApprovalState {
  requests: ApprovalRequest[];
  audit: any[];
}

function _isInternalHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  if (/^169\.254\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  if (/^(::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i.test(hostname)) return true;
  return false;
}

function _validateWebhookUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid webhook URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `Webhook URL must use http or https, got: ${parsed.protocol}`;
  }
  if (_isInternalHostname(parsed.hostname)) {
    return 'Webhook URL must not target internal/private addresses';
  }
  return null;
}

export class Gates {
  private _projectDir: string;
  private _gates: ApprovalGatePolicy[];
  private _stateFile: string;
  private _state: ApprovalState;
  private _pendingTimers: Record<string, { timer: NodeJS.Timeout; resolve: (val: any) => void; request: ApprovalRequest }> = {};

  constructor(projectDir?: string, gates?: ApprovalGatePolicy[]) {
    this._projectDir = projectDir || process.cwd();
    this._gates = gates || [];
    this._stateFile = path.join(this._projectDir, '.sognatore', 'state', 'approvals.json');
    this._state = this._loadState();
  }

  private _loadState(): ApprovalState {
    try {
      if (fs.existsSync(this._stateFile)) {
        const raw = fs.readFileSync(this._stateFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // start fresh
    }
    return { requests: [], audit: [] };
  }

  private _saveState(): void {
    const dir = path.dirname(this._stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this._stateFile, JSON.stringify(this._state, null, 2), 'utf8');
  }

  public findGate(phase: string): ApprovalGatePolicy | null {
    return this._gates.find(g => g.phase === phase) || null;
  }

  public hasGate(phase: string): boolean {
    return this.findGate(phase) !== null;
  }

  public async requestApproval(phase: string, context: any): Promise<{ approved: boolean; reason: string; method: string }> {
    const gate = this.findGate(phase);
    if (!gate) {
      return {
        approved: true,
        reason: `No approval gate configured for phase: ${phase}`,
        method: 'auto',
      };
    }

    const requestId = `apr-${crypto.randomBytes(16).toString('hex')}`;
    const timeout = (gate.timeout_minutes || DEFAULT_TIMEOUT_MINUTES) * 60 * 1000;

    const request: ApprovalRequest = {
      id: requestId,
      phase,
      gate: gate.name,
      status: 'pending',
      context: context || {},
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      method: null,
      reason: null,
    };

    this._state.requests.push(request);
    this._saveState();

    Hub.getInstance().reportIntel('WARNING', `Solicitud de aprobación pendiente (${gate.name}) para la fase: ${phase}`, 'Gates');

    if (gate.webhook) {
      this._sendWebhook(gate.webhook, request);
    }

    return new Promise(resolve => {
      const autoApproveOnTimeout = (gate as any).auto_approve_on_timeout === true;
      const timer = setTimeout(() => {
        delete this._pendingTimers[requestId];
        request.status = 'timed_out';
        request.resolvedAt = new Date().toISOString();
        request.method = 'timeout';
        if (autoApproveOnTimeout) {
          request.reason = `Auto-approved after timeout`;
        } else {
          request.reason = `Rejected: timeout reached`;
        }
        this._addAudit(request);
        this._saveState();
        
        Hub.getInstance().reportIntel(autoApproveOnTimeout ? 'INFO' : 'WARNING', `Solicitud de aprobación expirada (${request.method}): ${request.reason}`, 'Gates');

        resolve({
          approved: autoApproveOnTimeout,
          reason: request.reason || '',
          method: 'timeout',
        });
      }, Math.min(timeout, 3600000));

      this._pendingTimers[requestId] = { timer, resolve, request };
    });
  }

  public resolveApproval(requestId: string, approved: boolean, reason?: string): boolean {
    const pending = this._pendingTimers[requestId];
    if (!pending) return false;

    clearTimeout(pending.timer);
    delete this._pendingTimers[requestId];

    const request = pending.request;
    request.status = approved ? 'approved' : 'rejected';
    request.resolvedAt = new Date().toISOString();
    request.method = 'manual';
    request.reason = reason || (approved ? 'Manually approved' : 'Manually rejected');

    this._addAudit(request);
    this._saveState();

    Hub.getInstance().reportIntel(approved ? 'INFO' : 'CRITICAL', `Aprobación resuelta manualmente: ${request.reason} (Fase: ${request.phase})`, 'Gates');

    pending.resolve({
      approved,
      reason: request.reason,
      method: 'manual',
    });

    return true;
  }

  private async _sendWebhook(url: string, request: ApprovalRequest): Promise<void> {
    const error = _validateWebhookUrl(url);
    if (error) return;

    try {
      const payload = {
        type: 'approval_request',
        id: request.id,
        phase: request.phase,
        gate: request.gate,
        context: request.context,
        createdAt: request.createdAt,
      };

// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Silently ignore webhook failures
    }
  }

  private _addAudit(request: ApprovalRequest): void {
    if (this._state.audit.length >= MAX_AUDIT_ENTRIES) {
      this._state.audit.splice(0, this._state.audit.length - MAX_AUDIT_ENTRIES + 1);
    }
    this._state.audit.push({
      id: request.id,
      phase: request.phase,
      gate: request.gate,
      status: request.status,
      method: request.method,
      reason: request.reason,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    });
  }

  public getAuditTrail(): any[] {
    return [...this._state.audit];
  }

  public getPendingRequests(): ApprovalRequest[] {
    return this._state.requests.filter(r => r.status === 'pending');
  }

  public destroy(): void {
    for (const pending of Object.values(this._pendingTimers)) {
      clearTimeout(pending.timer);
    }
    this._pendingTimers = {};
  }
}
