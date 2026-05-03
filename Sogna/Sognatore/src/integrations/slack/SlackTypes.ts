import { IntegrationOptions } from '../adapter.js';

export interface SlackBlock {
  type: string;
  [key: string]: any;
}

export interface SlackEvent {
  type: string;
  user?: string;
  channel?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  [key: string]: any;
}

export interface SlackInteractionPayload {
  type: string;
  user: {
    id: string;
    name: string;
  };
  channel: {
    id: string;
    name: string;
  };
  actions: Array<{
    action_id: string;
    block_id: string;
    value: string;
    type: string;
    action_ts: string;
  }>;
  trigger_id: string;
  response_url: string;
  [key: string]: any;
}

export interface SlackAdapterOptions extends IntegrationOptions {
  token?: string;
  channel?: string;
  signingSecret?: string;
  [key: string]: any;
}
