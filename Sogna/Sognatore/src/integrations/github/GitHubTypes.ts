export type GitHubEventName = 'issues' | 'pull_request_review' | 'schedule' | 'workflow_dispatch';

export interface GitHubTriggerContext {
  triggerType: string;
  prd: string;
  provider: string;
  dryRun: boolean;
  sourceId: string | null;
  sourceType: string | null;
  labels: string[];
  metadata: Record<string, any>;
}

export interface GitHubActionOptions {
  eventName: GitHubEventName;
  payload: any;
  inputs?: Record<string, any>;
}

export interface LabelConfig {
  enabled?: boolean;
  priority?: 'high' | 'low';
  provider?: string;
  dryRun?: boolean;
}

export const ALLOWED_PROVIDERS = ['claude', 'codex', 'gemini'] as const;

export const LABEL_CONFIG_MAP: Record<string, LabelConfig> = {
  'sognatore': { enabled: true },
  'sognatore-priority-high': { priority: 'high' },
  'sognatore-priority-low': { priority: 'low' },
  'sognatore-provider-codex': { provider: 'codex' },
  'sognatore-provider-gemini': { provider: 'gemini' },
  'sognatore-dry-run': { dryRun: true },
};
