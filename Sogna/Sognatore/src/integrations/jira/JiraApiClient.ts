// @sentinel-ignore: GLOBAL
import { JiraClientConfig, JiraIssue, JiraSearchResponse, JiraTransition } from './JiraTypes.js';

export class JiraApiError extends Error {
  public readonly status: number;
  public readonly response: string;

  constructor(status: number, message: string, response: string) {
    super(`Jira API ${status}: ${message}`);
    this.name = 'JiraApiError';
    this.status = status;
    this.response = response;
  }
}

export class JiraApiClient {
  private readonly _baseUrl: string;
  private readonly _authHeader: string;
  private readonly _rateDelayMs: number;
  private _lastRequestTime: number = 0;

  constructor(opts: JiraClientConfig) {
    if (!opts || !opts.baseUrl || !opts.email || !opts.apiToken) {
      throw new Error('JiraApiClient requires baseUrl, email, and apiToken');
    }
    this._baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this._authHeader = 'Basic ' + Buffer.from(`${opts.email}:${opts.apiToken}`).toString('base64');
    this._rateDelayMs = opts.rateDelayMs || 100;
  }

  public async getIssue(issueKey: string): Promise<JiraIssue> {
    return this._request('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
  }

  public async searchIssues(jql: string, fields?: string[]): Promise<JiraSearchResponse> {
    const body: any = { jql, maxResults: 100 };
    if (fields) body.fields = fields;
    return this._request('POST', '/rest/api/3/search', body);
  }

  public async getEpicChildren(epicKey: string): Promise<JiraSearchResponse> {
    if (!/^[A-Z][A-Z0-9_]+-\d+$/.test(epicKey)) {
      throw new Error(`Invalid epic key format: ${epicKey}`);
    }
    return this.searchIssues(`"Epic Link" = "${epicKey}" ORDER BY rank ASC`);
  }

  public async createIssue(fields: any): Promise<JiraIssue> {
    return this._request('POST', '/rest/api/3/issue', { fields });
  }

  public async updateIssue(issueKey: string, fields: any): Promise<any> {
    return this._request('PUT', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`, { fields });
  }

  public async addComment(issueKey: string, body: string | object): Promise<any> {
    const adf = typeof body === 'string' ? {
      type: 'doc', version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
    } : body;
    return this._request('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, { body: adf });
  }

  public async getTransitions(issueKey: string): Promise<{ transitions: JiraTransition[] }> {
    return this._request('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`);
  }

  public async transitionIssue(issueKey: string, transitionId: string | number): Promise<any> {
    return this._request('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
      transition: { id: String(transitionId) },
    });
  }

  public async addRemoteLink(issueKey: string, linkUrl: string, title?: string): Promise<any> {
    return this._request('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/remotelink`, {
      object: { url: linkUrl, title: title || linkUrl },
    });
  }

  public getAuthHeader(): string {
    return this._authHeader;
  }

  private async _request(method: string, path: string, body?: any): Promise<any> {
    const now = Date.now();
    const delay = Math.max(0, this._rateDelayMs - (now - this._lastRequestTime));

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this._lastRequestTime = Date.now();
    const url = `${this._baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Authorization': this._authHeader,
      'Accept': 'application/json',
    };

    let fetchBody: string | undefined;
    if (body) {
      fetchBody = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: fetchBody,
        signal: AbortSignal.timeout(30000)
      });

      const raw = await response.text();

      if (!response.ok) {
        throw new JiraApiError(response.status, raw.slice(0, 300), raw);
      }

      if (response.status === 204 || !raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch (_) {
        return raw;
      }
    } catch (error: unknown) {
      if (error instanceof JiraApiError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Jira request failed: ${message}`, { cause: error });
    }
  }
}
