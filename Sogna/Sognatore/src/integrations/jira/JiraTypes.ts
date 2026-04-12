export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: any; // ADF format or string
    status: {
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    created: string;
    updated: string;
    [key: string]: any;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

export interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  rateDelayMs?: number;
}
