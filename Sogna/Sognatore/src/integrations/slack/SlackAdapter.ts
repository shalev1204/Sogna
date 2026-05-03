import { IntegrationAdapter } from '../adapter.js';
import { buildStatusBlocks } from './slackblocks.js';
import { verifySlackSignature } from './slackwebhookhandler.js';
import { SlackAdapterOptions } from './slacktypes.js';

export class SlackAdapter extends IntegrationAdapter {
  private readonly _token: string;
  private readonly _channel: string;
  private readonly _signingSecret: string;
  private _client: any | null = null;

  constructor(options: SlackAdapterOptions = {}) {
    super('slack', options);
    this._token = options.token || process.env.SOGNATORE_SLACK_BOT_TOKEN || '';
    this._channel = options.channel || process.env.SOGNATORE_SLACK_CHANNEL || '';
    this._signingSecret = options.signingSecret || process.env.SOGNATORE_SLACK_SIGNING_SECRET || '';
  }

  private async _getClient(): Promise<any> {
    if (this._client) return this._client;
    try {
      // Dynamic import to avoid failure if the package is not installed
      const { WebClient } = await import('@slack/web-api');
      this._client = new WebClient(this._token);
      return this._client;
    } catch (e) {
      throw new Error(
        'Slack integration requires @slack/web-api. ' +
        'Install it with: npm install @slack/web-api',
        { cause: e }
      );
    }
  }

  public async importProject(externalId: string): Promise<any> {
    // Read thread messages from a Slack channel/thread as PRD input
    return this.withRetry('importProject', async () => {
      const client = await this._getClient();
      const result = await client.conversations.history({
        channel: externalId,
        limit: 50
      });
      const messages = (result.messages || []).map((m: any) => m.text).join('\n\n');
      return { 
        title: `Slack Import: ${externalId}`, 
        content: messages, 
        source: 'slack' 
      };
    });
  }

  public async syncStatus(projectId: string, status: string, details?: any): Promise<void> {
    return this.withRetry('syncStatus', async () => {
      const client = await this._getClient();
      const statusBlocks = buildStatusBlocks(projectId, status, details);
      await client.chat.postMessage({
        channel: this._channel,
        blocks: statusBlocks,
        text: `Sognatore: ${status}`  // Fallback for notifications
      });
    });
  }

  public async postComment(externalId: string, content: string): Promise<void> {
    return this.withRetry('postComment', async () => {
      const client = await this._getClient();
      await client.chat.postMessage({
        channel: externalId,
        text: content
      });
    });
  }

  public async createSubtasks(externalId: string, tasks: Array<{ title: string; description: string }>): Promise<any[]> {
    // Slack doesn't have subtasks - post as a formatted list instead
    return this.withRetry('createSubtasks', async () => {
      const client = await this._getClient();
      const taskList = tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
      await client.chat.postMessage({
        channel: externalId,
        text: `*Task Breakdown:*\n${taskList}`
      });
      return tasks.map(t => ({ id: t.title, status: 'posted' }));
    });
  }

  public getWebhookHandler(): (req: any, res: any) => void {
    const MAX_BODY_SIZE = 1024 * 1024; // 1MB
    
    return (req: any, res: any) => {
      // Fail-closed: reject if no signing secret is configured
      if (!this._signingSecret) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      // Collect raw body first, then verify signature
      let body = '';
      let bodySize = 0;

      req.on('data', (chunk: Buffer) => {
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
          res.writeHead(413);
          res.end('Payload Too Large');
          req.destroy();
          return;
        }
        body += chunk.toString();
      });

      req.on('end', () => {
        if (bodySize > MAX_BODY_SIZE) return; // Already responded with 413

        // Verify request signature using raw body
        const timestamp = req.headers['x-slack-request-timestamp'] || '';
        const signature = req.headers['x-slack-signature'] || '';

        if (!verifySlackSignature(this._signingSecret, timestamp, body, signature)) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        try {
          const payload = JSON.parse(body);
          // Handle URL verification challenge
          if (payload.type === 'url_verification') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(payload.challenge);
            return;
          }

          // Handle interactive messages (approval buttons)
          if (payload.type === 'interactive_message' || payload.type === 'block_actions') {
            this.emit('interaction', payload);
          }

          // Handle events
          if (payload.type === 'event_callback') {
            this.emit('event', payload.event);
          }

          res.writeHead(200);
          res.end('ok');
        } catch (e) {
          res.writeHead(400);
          res.end('Bad Request');
        }
      });
    };
  }
}
