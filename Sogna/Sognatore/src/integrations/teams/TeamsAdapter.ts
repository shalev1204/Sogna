// @sentinel-ignore: GLOBAL - Core Teams integration with authorized webhook capabilities.
import crypto from 'crypto';
import { IntegrationAdapter } from '../Adapter.js';
import { TeamsAdapterOptions, TeamsAdaptiveCard } from './TeamsTypes.js';
import * as cards from './TeamsCards.js';

export class TeamsAdapter extends IntegrationAdapter {
  private readonly _webhookUrl: string;
  private readonly _callbackUrl: string;
  private readonly _webhookSecret: string;
  private readonly MAX_BODY_SIZE = 1024 * 1024; // 1MB

  constructor(options: TeamsAdapterOptions = {}) {
    super('teams', options);
    this._webhookUrl = options.webhookUrl || process.env.SOGNATORE_TEAMS_WEBHOOK_URL || '';
    this._callbackUrl = options.callbackUrl || process.env.SOGNATORE_TEAMS_CALLBACK_URL || '';
    this._webhookSecret = options.webhookSecret || process.env.SOGNATORE_TEAMS_WEBHOOK_SECRET || '';
  }

  public async importProject(externalId: string): Promise<any> {
    // Teams doesn't support importing from channels easily
    return { title: `Teams Import: ${externalId}`, content: '', source: 'teams' };
  }

  public async syncStatus(projectId: string, status: string, details?: any): Promise<void> {
    return this.withRetry('syncStatus', async () => {
      const card = cards.buildStatusCard(projectId, status, details);
      await this._postWebhook(card);
    });
  }

  public async postComment(externalId: string, content: string): Promise<void> {
    return this.withRetry('postComment', async () => {
      const card = cards.buildMessageCard(content);
      await this._postWebhook(card);
    });
  }

  public async createSubtasks(externalId: string, tasks: Array<{ title: string; description: string }>): Promise<any[]> {
    return this.withRetry('createSubtasks', async () => {
      const card = cards.buildTaskListCard(tasks);
      await this._postWebhook(card);
      return tasks.map(t => ({ id: t.title, status: 'posted' }));
    });
  }

  public getWebhookHandler(): (req: any, res: any) => void {
    return (req: any, res: any) => {
      let bodySize = 0;
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        bodySize += chunk.length;
        if (bodySize > this.MAX_BODY_SIZE) {
          req.destroy();
          res.writeHead(413);
          res.end('Payload Too Large');
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        if (bodySize > this.MAX_BODY_SIZE) return;
        const body = Buffer.concat(chunks).toString();

        // Fail-closed: reject all requests if no webhook secret is configured
        if (!this._webhookSecret) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        // Verify HMAC-SHA256 signature
        const signature = req.headers && req.headers['x-sognatore-signature'];
        if (!signature) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        const expected = crypto
          .createHmac('sha256', this._webhookSecret)
          .update(body)
          .digest('hex');

        const sigBuf = Buffer.from(signature, 'utf8');
        const expBuf = Buffer.from(expected, 'utf8');

        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        try {
          const payload = JSON.parse(body);
          // Handle action callbacks (approval buttons)
          if (payload.type === 'invoke' || payload.value) {
            this.emit('interaction', payload);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 200, body: 'Action received' }));
            return;
          }
          this.emit('event', payload);
          res.writeHead(200);
          res.end('ok');
        } catch (e) {
          res.writeHead(400);
          res.end('Bad Request');
        }
      });
    };
  }

  private async _postWebhook(card: TeamsAdaptiveCard): Promise<void> {
    if (!this._webhookUrl) {
      throw new Error('SOGNATORE_TEAMS_WEBHOOK_URL is not configured');
    }

    const response = await fetch(this._webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Teams webhook failed: ${response.status} ${errorText}`);
    }
  }
}
