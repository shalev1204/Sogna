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
  'Sognatore': { enabled: true },
  'Sognatore-priority-high': { priority: 'high' },
  'Sognatore-priority-low': { priority: 'low' },
  'Sognatore-provider-codex': { provider: 'codex' },
  'Sognatore-provider-gemini': { provider: 'gemini' },
  'Sognatore-dry-run': { dryRun: true },
};
