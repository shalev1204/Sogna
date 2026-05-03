import crypto from 'crypto';
import { JiraIssue } from './jiratypes.js';

export const SUPPORTED_EVENTS = ['jira:issue_created', 'jira:issue_updated', 'sprint_started'];

export interface JiraWebhookResponse {
  status: number;
  response: {
    error?: string;
    ignored?: boolean;
    reason?: string;
    processed?: boolean;
    eventType?: string;
  };
}

export interface WebhookHandlerOptions {
  secret?: string | null;
  onEpicCreated?: (issue: JiraIssue) => void;
  onIssueUpdated?: (issue: JiraIssue, changelog: any) => void;
  issueTypes?: string[];
}

/**
 * Jira Webhook Handler.
 */
export class WebhookHandler {
  private readonly _secret: string | null;
  private readonly _onEpicCreated: ((issue: JiraIssue) => void) | null;
  private readonly _onIssueUpdated: ((issue: JiraIssue, changelog: any) => void) | null;
  private readonly _issueTypes: string[];

  constructor(opts?: WebhookHandlerOptions) {
    this._secret = opts?.secret || null;
    this._onEpicCreated = opts?.onEpicCreated || null;
    this._onIssueUpdated = opts?.onIssueUpdated || null;
    this._issueTypes = opts?.issueTypes || ['Epic', 'Story'];
  }

  /**
   * Handle an incoming webhook request.
   */
  public handleRequest(headers: Record<string, string>, rawBody: string | Buffer): JiraWebhookResponse {
    // Verify signature if secret is configured
    if (this._secret) {
      if (!this.verifySignature(headers, rawBody)) {
        return { status: 401, response: { error: 'Invalid signature' } };
      }
    }

    let body: any;
    try {
      body = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
    } catch (_) {
      return { status: 400, response: { error: 'Invalid JSON body' } };
    }

    const eventInfos = this.parseEvent(body);
    if (!eventInfos) {
      return { status: 200, response: { ignored: true, reason: 'Unsupported event' } };
    }

    const { eventType, issue, changelog } = eventInfos;

    // Filter by issue type
    const issueType = issue?.fields?.issuetype?.name || null;
    if (issueType && !this._issueTypes.includes(issueType)) {
      return { status: 200, response: { ignored: true, reason: `Irrelevant issue type: ${issueType}` } };
    }

    // Dispatch to callbacks
    try {
      if (eventType === 'jira:issue_created' && issueType === 'Epic' && this._onEpicCreated && issue) {
        this._onEpicCreated(issue);
      } else if (eventType === 'jira:issue_updated' && this._onIssueUpdated && issue) {
        this._onIssueUpdated(issue, changelog);
      }
    } catch (callbackErr: any) {
      return { status: 500, response: { error: `Callback error: ${callbackErr.message}` } };
    }

    return { status: 200, response: { processed: true, eventType } };
  }

  /**
   * Verify HMAC-SHA256 signature.
   */
  public verifySignature(headers: Record<string, string>, rawBody: string | Buffer): boolean {
    if (!this._secret) return true;
    const signature = headers['x-hub-signature'] || headers['X-Hub-Signature'] || '';
    if (!signature) return false;

    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString();
    const expected = 'sha256=' + crypto.createHmac('sha256', this._secret).update(bodyStr).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  /**
   * Parse a webhook event body.
   */
  public parseEvent(body: any): { eventType: string; issue: JiraIssue | null; changelog: any | null } | null {
    if (!body || !body.webhookEvent) return null;
    if (!SUPPORTED_EVENTS.includes(body.webhookEvent)) return null;
    return {
      eventType: body.webhookEvent,
      issue: body.issue || null,
      changelog: body.changelog || null,
    };
  }
}
