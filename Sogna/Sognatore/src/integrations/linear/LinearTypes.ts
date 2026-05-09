export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  priorityLabel: string;
  url: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  labels: {
    nodes: Array<{
      id: string;
      name: string;
    }>;
  };
  parent?: {
    id: string;
    identifier: string;
    title: string;
  };
  children: {
    nodes: Array<{
      id: string;
      identifier: string;
      title: string;
      state: {
        name: string;
      };
    }>;
  };
  relations: {
    nodes: Array<{
      type: string;
      relatedIssue: {
        id: string;
        identifier: string;
        title: string;
      };
    }>;
  };
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  url: string;
  lead?: {
    id: string;
    name: string;
  };
  issues: {
    nodes: Array<Partial<LinearIssue>>;
  };
}

export const PRIORITY_MAP: Record<number, string> = {
  0: 'none',
  1: 'urgent',
  2: 'high',
  3: 'medium',
  4: 'low',
};

export const VALID_Cycle_STATUSES = new Set(['REASON', 'ACT', 'REFLECT', 'VERIFY', 'DONE']);

export const DEFAULT_STATUS_MAPPING: Record<string, string> = {
  'REASON': 'In Progress',
  'ACT': 'In Progress',
  'REFLECT': 'In Progress',
  'VERIFY': 'In Review',
  'DONE': 'Done',
};

export interface LinearAuditLog {
  id: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
  };
  event: string;
}

export interface LinearSearchResponse {
  nodes: LinearIssue[];
}

export interface LinearTeamState {
  id: string;
  name: string;
  type: string;
}

export interface LinearClientOptions {
  timeout?: number;
}

export interface LinearClientConfig {
  apiKey: string;
  teamId?: string;
  statusMapping?: Record<string, string>;
  webhookSecret?: string;
}
