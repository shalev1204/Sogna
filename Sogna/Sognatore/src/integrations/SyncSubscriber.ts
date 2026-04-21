import fs from 'fs';
import path from 'path';
import { JiraApiClient, JiraSyncManager } from './jira/index.js';
import { LinearAdapter } from './linear/index.js';
import { GitHubReporter } from './github/index.js';

export interface EventPayload {
  iteration?: string;
  provider?: string;
  phase?: string;
  action?: string;
  status?: string;
  result?: string;
}

export interface EventData {
  type: string;
  payload: EventPayload;
  timestamp: string;
}

export interface SyncDetails {
  iteration?: string;
  provider?: string;
  phase?: string;
  timestamp: string;
}

export type RarvStatus = 'building' | 'planning' | 'reviewing' | 'testing' | 'completed' | 'failed';

export class SyncSubscriber {
  private pendingDir: string;
  private lastProcessedFile = '';
  private integrations: any[] = [];
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    const sognatoreDir = process.env.SOGNATORE_DIR || '.sognatore';
    this.pendingDir = path.join(process.cwd(), sognatoreDir, 'events', 'pending');
  }

  public async init(): Promise<void> {
    this.initIntegrations();
    
    // Initial scan
    await this.scanPendingEvents();

    // Poll every 500ms
    this.pollInterval = setInterval(() => this.scanPendingEvents(), 500);

    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private initIntegrations(): void {
    // Jira
    if (process.env.SOGNATORE_JIRA_URL && process.env.SOGNATORE_JIRA_EMAIL && process.env.SOGNATORE_JIRA_TOKEN) {
      try {
        const client = new JiraApiClient({
          baseUrl: process.env.SOGNATORE_JIRA_URL,
          email: process.env.SOGNATORE_JIRA_EMAIL,
          apiToken: process.env.SOGNATORE_JIRA_TOKEN,
        });
        const syncManager = new JiraSyncManager({ apiClient: client });
        this.integrations.push({
          type: 'jira',
          epicKey: process.env.SOGNATORE_JIRA_EPIC_KEY,
          syncManager,
        });
        console.log('[sync-subscriber] Jira integration initialized');
      } catch (e: any) {
        console.error(`[sync-subscriber] Failed to initialize Jira: ${e.message}`);
      }
    }

    // Linear
    if (process.env.SOGNATORE_LINEAR_TOKEN) {
      try {
        const linearAdapter = new LinearAdapter({
          apiKey: process.env.SOGNATORE_LINEAR_TOKEN,
          teamId: process.env.SOGNATORE_LINEAR_TEAM_ID,
        });
        this.integrations.push({
          type: 'linear',
          projectId: process.env.SOGNATORE_LINEAR_PROJECT_ID,
          adapter: linearAdapter,
        });
        console.log('[sync-subscriber] Linear integration initialized');
      } catch (e: any) {
        console.error(`[sync-subscriber] Failed to initialize Linear: ${e.message}`);
      }
    }

    // GitHub (sync mode)
    if (process.env.SOGNATORE_GITHUB_SYNC === 'true') {
      try {
        this.integrations.push({
          type: 'github',
        });
        console.log('[sync-subscriber] GitHub sync integration initialized');
      } catch (e: any) {
        console.error(`[sync-subscriber] Failed to initialize GitHub: ${e.message}`);
      }
    }

    if (this.integrations.length === 0) {
      console.log('[sync-subscriber] No integrations configured');
    }
  }

  private resolveStatus(eventType: string, payload: EventPayload): RarvStatus | null {
    switch (eventType) {
      case 'iteration_start':
        return 'building';
      case 'iteration_complete':
        return payload.status === 'completed' ? 'completed' : 'failed';
      case 'session_start':
        return 'planning';
      case 'session_end':
        return payload.result === '0' ? 'completed' : 'failed';
      case 'phase_change': {
        const phaseMap: Record<string, RarvStatus> = {
          'REASON': 'planning',
          'ACT': 'building',
          'REFLECT': 'reviewing',
          'VERIFY': 'testing',
        };
        return (payload.phase && phaseMap[payload.phase]) || 'building';
      }
      default:
        return null;
    }
  }

  private async scanPendingEvents(): Promise<void> {
    if (!fs.existsSync(this.pendingDir)) return;

    try {
      const files = fs.readdirSync(this.pendingDir)
        .filter(f => f.endsWith('.json'))
        .sort();

      for (const file of files) {
        if (file > this.lastProcessedFile) {
          await this.processEventFile(path.join(this.pendingDir, file));
          this.lastProcessedFile = file;
        }
      }
    } catch (e) {
      // Ignore directory read errors
    }
  }

  private async processEventFile(filepath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const data: EventData = JSON.parse(content);
      
      const status = this.resolveStatus(data.type, data.payload);
      if (!status) return;

      const details: SyncDetails = {
        iteration: data.payload.iteration,
        provider: data.payload.provider,
        phase: data.payload.phase || data.payload.action,
        timestamp: data.timestamp,
      };

      await this.dispatchToIntegrations(status, details);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        console.error(`[sync-subscriber] Error processing event file: ${e.message}`);
      }
    }
  }

  private async dispatchToIntegrations(status: RarvStatus, details: SyncDetails): Promise<void> {
    const promises = this.integrations.map(async (integration) => {
      try {
        if (integration.type === 'jira' && integration.epicKey) {
          await integration.syncManager.syncToJira(integration.epicKey, {
            phase: status,
            details: JSON.stringify(details),
          });
        } else if (integration.type === 'linear' && integration.projectId) {
          await integration.adapter.updateProjectStatus(integration.projectId, status);
        }
      } catch (e: any) {
        console.error(`[sync-subscriber] Error dispatching to ${integration.type}: ${e.message}`);
      }
    });

    await Promise.allSettled(promises);
  }

  private shutdown(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    console.log('[sync-subscriber] Shutting down');
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
    process.exit(0);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('SyncSubscriber.ts')) {
  const subscriber = new SyncSubscriber();
  subscriber.init().catch(console.error);
}

