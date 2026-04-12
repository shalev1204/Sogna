import { IntegrationOptions } from '../Adapter.js';

export interface TeamsFact {
  title: string;
  value: string;
}

export interface TeamsAdaptiveCard {
  type: string;
  attachments: Array<{
    contentType: string;
    content: {
      '$schema': string;
      type: string;
      version: string;
      body: any[];
      actions?: any[];
    };
  }>;
}

export interface TeamsAdapterOptions extends IntegrationOptions {
  webhookUrl?: string;
  callbackUrl?: string;
  webhookSecret?: string;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  [key: string]: any;
}
