import { JiraApiClient } from './JiraApiClient.js';
import { SyncManagerOptions, JiraSyncManager } from './SyncManager.js';
import { WebhookHandlerOptions, WebhookHandler } from './WebhookHandler.js';
import { 
  convertEpicToPrd, 
  extractAcceptanceCriteria, 
  generatePrdMetadata 
} from './EpicConverter.js';
import { mapSognatoreStatusToJira, STATUS_MAP } from './SyncManager.js';

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
