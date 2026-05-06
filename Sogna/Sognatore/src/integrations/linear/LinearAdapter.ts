import crypto from 'crypto';
import { IntegrationAdapter } from '../Adapter.js';
import { 
  LinearClientConfig, 
  PRIORITY_MAP, 
  VALID_RARV_STATUSES, 
  DEFAULT_STATUS_MAPPING,
  LinearIssue,
  LinearProject
} from './LinearTypes.js';
import { LinearApiClient, LinearApiError } from './LinearApiClient.js';

const MAX_WEBHOOK_BODY_BYTES = 1 * 1024 * 1024; // 1MB

export class LinearAdapter extends IntegrationAdapter {
  private config: LinearClientConfig;
  private client: LinearApiClient;
  private _stateCache: Map<string, any[]> = new Map();

  constructor(config: LinearClientConfig, options = {}) {
    super('linear', options);
    this.config = config;
    if (!config.apiKey) {
      throw new Error('Linear API key is required');
    }
    this.client = new LinearApiClient(config.apiKey);
  }

  public async importProject(externalId: string): Promise<any> {
    return this.withRetry('importProject', async () => {
      let issue: LinearIssue | null;
      try {
        issue = await this.client.getIssue(externalId);
      } catch (e) {
        const isNotFound = (
          (e instanceof LinearApiError && e.statusCode === 404) ||
          (e instanceof LinearApiError && /not found/i.test(e.message))
        );
        if (!isNotFound) throw e;
        
        const project = await this.client.getProject(externalId);
        return this._projectToPrd(project);
      }

      if (!issue) {
        const project = await this.client.getProject(externalId);
        return this._projectToPrd(project);
      }
      return this._issueToPrd(issue);
    });
  }

  public async syncStatus(projectId: string, status: string, details?: any): Promise<any> {
    if (!VALID_RARV_STATUSES.has(status)) {
      throw new Error(`Unknown RARV status "${status}". Valid values: ${[...VALID_RARV_STATUSES].join(', ')}`);
    }

    const mapping = this.config.statusMapping || DEFAULT_STATUS_MAPPING;
    const linearStatus = mapping[status];

    return this.withRetry('syncStatus', async () => {
      const teamId = this._requireTeamId();
      const stateId = await this._resolveStateId(teamId, linearStatus);
      const result = await this.client.updateIssue(projectId, { stateId });
      
      if (details && details.message) {
        const commentBody = `**Sognatore [${status}]**: ${details.message}`;
        await this.client.createComment(projectId, commentBody);
      }

      this.emit('status-synced', { externalId: projectId, status, linearStatus, stateId });
      return result;
    });
  }

  public async postComment(externalId: string, content: string): Promise<any> {
    return this.withRetry('postComment', async () => {
      const result = await this.client.createComment(externalId, content);
      this.emit('comment-posted', { externalId, commentId: result.comment?.id });
      return result;
    });
  }

  public async createSubtasks(externalId: string, tasks: Array<{ title: string; description: string }>): Promise<any[]> {
    return this.withRetry('createSubtasks', async () => {
      const issue = await this.client.getIssue(externalId);
      const teamId = this._requireTeamId();
      const existingTitles = new Set((issue?.children?.nodes || []).map(c => c.title));
      
      const results = [];
      for (const task of tasks) {
        if (existingTitles.has(task.title)) continue;
        const result = await this.client.createSubIssue(externalId, teamId, task.title, task.description || '');
        results.push(result);
      }

      this.emit('subtasks-created', { externalId, count: results.length });
      return results;
    });
  }

  public getWebhookHandler(): (req: any, res: any) => void {
    return (req: any, res: any) => {
      let body = '';
      let bodySize = 0;
      let aborted = false;

      req.on('data', (chunk: Buffer) => {
        if (aborted) return;
        bodySize += chunk.length;
        if (bodySize > MAX_WEBHOOK_BODY_BYTES) {
          aborted = true;
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          return;
        }
        body += chunk;
      });

      req.on('end', () => {
        if (aborted) return;

        if (this.config.webhookSecret) {
          const signature = req.headers['linear-signature'];
          if (!this._verifyWebhookSignature(body, signature)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid signature' }));
            return;
          }
        }

        try {
          const payload = JSON.parse(body);
          const event = this._processWebhookEvent(payload);
          this.emit('webhook', event);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    };
  }

  private _issueToPrd(issue: LinearIssue) {
    const labels = (issue.labels?.nodes || []).map(l => l.name);
    // Note: TypeScript doesn't allow indexing by string unless explicitly typed, but Priority is number
    const priority = PRIORITY_MAP[issue.priority] || 'medium';
    
    return {
      source: 'linear',
      externalId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      priority,
      labels,
      status: issue.state?.name || 'unknown',
      assignee: issue.assignee ? {
        name: issue.assignee.name,
        email: issue.assignee.email,
      } : null,
      url: issue.url,
      prd: {
        overview: issue.title,
        description: issue.description || '',
        requirements: this._extractRequirements(issue.description || ''),
      },
    };
  }

  private _projectToPrd(project: LinearProject) {
    const issues = (project.issues?.nodes || []).map(issue => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      priority: PRIORITY_MAP[issue.priority as number] || 'medium',
      status: issue.state?.name || 'unknown',
    }));

    return {
      source: 'linear',
      externalId: project.id,
      title: project.name,
      description: project.description || '',
      status: project.state,
      url: project.url,
      prd: {
        overview: project.name,
        description: project.description || '',
        requirements: issues.map(i => i.title),
      },
    };
  }

  private _extractRequirements(description: string): string[] {
    if (!description) return [];
    const lines = description.split('\n');
    const reqs: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        reqs.push(trimmed.replace(/^[-*\d.]+\s+/, ''));
      }
    }
    return reqs;
  }

  private async _resolveStateId(teamId: string, statusName: string): Promise<string> {
    if (!this._stateCache.has(teamId)) {
      const states = await this.client.getTeamStates(teamId);
      this._stateCache.set(teamId, states);
    }
    const states = this._stateCache.get(teamId)!;
    const state = states.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    if (!state) {
      throw new Error(`State "${statusName}" not found for team ${teamId}`);
    }
    return state.id;
  }

  private _requireTeamId(): string {
    if (this.config.teamId) return this.config.teamId;
    throw new Error('teamId is required in Linear integration config.');
  }

  private _verifyWebhookSignature(body: string, signature: string): boolean {
    if (!signature || !this.config.webhookSecret) return false;
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    hmac.update(body);
    const expected = hmac.digest('hex');
    const normalizedSig = signature.toLowerCase().trim();
    if (normalizedSig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(normalizedSig, 'hex'), Buffer.from(expected, 'hex'));
  }

  private _processWebhookEvent(payload: any) {
    return {
      action: payload.action || 'unknown',
      type: payload.type || 'unknown',
      data: payload.data || {},
      timestamp: new Date().toISOString(),
      processed: true,
    };
  }
}
