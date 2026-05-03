import { JiraApiClient } from './jiraapiclient.js';
import { SyncManagerOptions, JiraSyncManager } from './syncmanager.js';
import { WebhookHandlerOptions, WebhookHandler } from './webhookhandler.js';
import { 
  convertEpicToPrd, 
  extractAcceptanceCriteria, 
  generatePrdMetadata 
} from './epicconverter.js';
import { mapSognatoreStatusToJira, STATUS_MAP } from './syncmanager.js';

export {
  JiraApiClient,
  JiraSyncManager,
  WebhookHandler,
  convertEpicToPrd,
  extractAcceptanceCriteria,
  generatePrdMetadata,
  mapSognatoreStatusToJira,
  STATUS_MAP
};

/**
 * Create a configured Jira sync manager.
 */
export function createSync(config: { 
  baseUrl: string; 
  email: string; 
  apiToken: string; 
  projectKey?: string;
  rateDelayMs?: number;
}): JiraSyncManager {
  const client = new JiraApiClient({
    baseUrl: config.baseUrl,
    email: config.email,
    apiToken: config.apiToken,
    rateDelayMs: config.rateDelayMs,
  });
  return new JiraSyncManager({
    apiClient: client,
    projectKey: config.projectKey,
  });
}

/**
 * Create a configured webhook handler.
 */
export function createWebhookHandler(config: WebhookHandlerOptions): WebhookHandler {
  return new WebhookHandler(config);
}
