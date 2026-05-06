import { 
  GitHubActionOptions, 
  GitHubTriggerContext, 
  ALLOWED_PROVIDERS, 
  LABEL_CONFIG_MAP,
  LabelConfig
} from './GitHubTypes.js';

export function mapLabelsToConfig(labels: string[]): LabelConfig {
  const config: LabelConfig = {};
  if (!Array.isArray(labels)) return config;

  labels.forEach((label) => {
    const mapping = LABEL_CONFIG_MAP[label];
    if (mapping) {
      Object.assign(config, mapping);
    }
  });

  return config;
}

export function extractPrdFromBody(body: string): string {
  if (!body || typeof body !== 'string') return '';

  // Try HTML comment markers first
  const commentMatch = body.match(/<!--\s*PRD_START\s*-->([\s\S]*?)<!--\s*PRD_END\s*-->/i);
  if (commentMatch) return commentMatch[1].trim();

  // Try fenced code block with prd language
  const codeMatch = body.match(/```prd\s*\n([\s\S]*?)```/i);
  if (codeMatch) return codeMatch[1].trim();

  // Try PRD section header
  const sectionMatch = body.match(/(?:^|\n)##\s+PRD\s*\n([\s\S]*?)(?=\n##\s|\s*$)/i);
  if (sectionMatch) return sectionMatch[1].trim();

  return body.trim();
}

export function parseIssueEvent(payload: any): GitHubTriggerContext {
  const issue = payload.issue || {};
  const label = payload.label || {};
  const labels: string[] = (issue.labels || []).map((l: any) => 
    typeof l === 'string' ? l : l.name
  );

  const config = mapLabelsToConfig(labels);

  return {
    triggerType: 'issue',
    prd: extractPrdFromBody(issue.body || ''),
    provider: config.provider || 'claude',
    dryRun: !!config.dryRun,
    sourceId: String(issue.number || ''),
    sourceType: 'issue',
    labels,
    metadata: {
      issueNumber: issue.number,
      issueTitle: issue.title || '',
      issueUrl: issue.html_url || '',
      triggerLabel: label.name || '',
      author: issue.user?.login || '',
      repository: payload.repository?.full_name || '',
    },
  };
}

export function parsePullRequestReviewEvent(payload: any): GitHubTriggerContext {
  const pr = payload.pull_request || {};
  const review = payload.review || {};
  const labels: string[] = (pr.labels || []).map((l: any) => 
    typeof l === 'string' ? l : l.name
  );

  const config = mapLabelsToConfig(labels);

  return {
    triggerType: 'pull_request_review',
    prd: extractPrdFromBody(pr.body || ''),
    provider: config.provider || 'claude',
    dryRun: !!config.dryRun,
    sourceId: String(pr.number || ''),
    sourceType: 'pull_request',
    labels,
    metadata: {
      prNumber: pr.number,
      prTitle: pr.title || '',
      prUrl: pr.html_url || '',
      prHead: pr.head?.ref || '',
      prBase: pr.base?.ref || '',
      reviewState: review.state || '',
      reviewAuthor: review.user?.login || '',
      author: pr.user?.login || '',
      repository: payload.repository?.full_name || '',
    },
  };
}

export function parseScheduleEvent(payload: any): GitHubTriggerContext {
  return {
    triggerType: 'schedule',
    prd: '',
    provider: 'claude',
    dryRun: false,
    sourceId: null,
    sourceType: null,
    labels: [],
    metadata: {
      schedule: payload?.schedule || '',
      repository: payload.repository?.full_name || '',
    },
  };
}

export function parseWorkflowDispatchEvent(payload: any, inputs: any): GitHubTriggerContext {
  const prdContent = inputs?.prd_content || '';
  const rawProvider = inputs?.provider || 'claude';
  const provider = (ALLOWED_PROVIDERS as unknown as string[]).includes(rawProvider) 
    ? rawProvider 
    : 'claude';
  
  const dryRun = inputs?.dry_run === true || inputs?.dry_run === 'true';

  return {
    triggerType: 'workflow_dispatch',
    prd: prdContent,
    provider,
    dryRun,
    sourceId: null,
    sourceType: null,
    labels: [],
    metadata: {
      sender: payload?.sender?.login || '',
      repository: payload?.repository?.full_name || '',
    },
  };
}

export function parseTriggerContext(options: GitHubActionOptions): GitHubTriggerContext {
  const { eventName, payload, inputs } = options;

  switch (eventName) {
    case 'issues':
      return parseIssueEvent(payload);
    case 'pull_request_review':
      return parsePullRequestReviewEvent(payload);
    case 'schedule':
      return parseScheduleEvent(payload);
    case 'workflow_dispatch':
      return parseWorkflowDispatchEvent(payload, inputs);
    default:
      return {
        triggerType: 'unknown',
        prd: '',
        provider: 'claude',
        dryRun: false,
        sourceId: null,
        sourceType: null,
        labels: [],
        metadata: { eventName },
      };
  }
}
