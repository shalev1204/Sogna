import { JiraApiClient } from './jiraapiclient.js';
import { convertEpicToPrd, generatePrdMetadata } from './epicconverter.js';
import { JiraIssue } from './jiratypes.js';

export const STATUS_MAP: Record<string, string> = {
  'planning': 'In Progress',
  'building': 'In Progress',
  'testing': 'In Review',
  'reviewing': 'In Review',
  'deployed': 'Done',
  'completed': 'Done',
  'failed': 'Blocked',
  'blocked': 'Blocked',
};

/**
 * Jira Bidirectional Sync Manager.
 */
export interface SyncManagerOptions {
  apiClient: JiraApiClient;
  projectKey?: string;
}

export class JiraSyncManager {
  private readonly _api: JiraApiClient;
  private readonly _projectKey: string | null;

  constructor(opts: SyncManagerOptions) {
    if (!opts || !opts.apiClient) {
      throw new Error('JiraSyncManager requires apiClient');
    }
    this._api = opts.apiClient;
    this._projectKey = opts.projectKey || null;
  }

  /**
   * Inbound: Fetch a Jira epic and convert to PRD.
   */
  public async syncFromJira(epicKey: string): Promise<{ prd: string; metadata: any }> {
    const epic = await this._api.getIssue(epicKey);
    const childResult = await this._api.getEpicChildren(epicKey);
    const children = childResult?.issues || [];
    const prd = convertEpicToPrd(epic, children);
    const metadata = generatePrdMetadata(epic);
    return { prd, metadata };
  }

  /**
   * Outbound: Sync RARV state to Jira epic.
   */
  public async syncToJira(epicKey: string, rarvState: { phase: string; details?: string; progress?: number }): Promise<void> {
    if (!rarvState || !rarvState.phase) return;

    // Update status via transition
    const jiraStatus = mapSognatoreStatusToJira(rarvState.phase);
    if (jiraStatus) {
      await this._transitionToStatus(epicKey, jiraStatus);
    }

    // Add progress comment
    if (rarvState.details) {
      let comment = `[Sognatore] Phase: ${rarvState.phase}`;
      if (rarvState.progress !== undefined) {
        comment += ` (${rarvState.progress}%)`;
      }
      comment += `\n${rarvState.details}`;
      await this._api.addComment(epicKey, comment);
    }
  }

  /**
   * Update a specific issue's status.
   */
  public async updateTaskStatus(issueKey: string, status: string, details?: string): Promise<void> {
    const jiraStatus = mapSognatoreStatusToJira(status);
    if (jiraStatus) {
      await this._transitionToStatus(issueKey, jiraStatus);
    }
    if (details) {
      await this._api.addComment(issueKey, `[Sognatore] Status: ${status}\n${details}`);
    }
  }

  /**
   * Post a quality report as a Jira comment.
   */
  public async postQualityReport(issueKey: string, report: { type?: string; summary?: string; passed?: number; failed?: number; coverage?: number }): Promise<void> {
    let text = '[Sognatore] Quality Report\n';
    if (report.type) text += `Type: ${report.type}\n`;
    if (report.summary) text += `${report.summary}\n`;
    if (report.passed !== undefined) text += `Passed: ${report.passed}\n`;
    if (report.failed !== undefined) text += `Failed: ${report.failed}\n`;
    if (report.coverage !== undefined) text += `Coverage: ${report.coverage}%\n`;
    await this._api.addComment(issueKey, text);
  }

  /**
   * Add a deployment link to a Jira issue.
   */
  public async addDeploymentLink(issueKey: string, deployUrl: string, env?: string): Promise<void> {
    const title = `Deployment${env ? ` (${env})` : ''}`;
    await this._api.addRemoteLink(issueKey, deployUrl, title);
  }

  /**
   * Create sub-tasks in Jira mirroring Sognatore's decomposition.
   */
  public async createSubTasks(parentKey: string, tasks: Array<{ title: string; description?: string }>): Promise<string[]> {
    const keys: string[] = [];
    for (const task of tasks) {
      const fields: any = {
        summary: task.title,
        description: task.description || '',
        issuetype: { name: 'Sub-task' },
        parent: { key: parentKey },
      };
      if (this._projectKey) fields.project = { key: this._projectKey };
      const result = await this._api.createIssue(fields);
      keys.push(result.key);
    }
    return keys;
  }

  private async _transitionToStatus(issueKey: string, targetStatus: string): Promise<void> {
    const transResult = await this._api.getTransitions(issueKey);
    const transitions = transResult?.transitions || [];
    for (const transition of transitions) {
      if (transition.name === targetStatus || transition.to.name === targetStatus) {
        await this._api.transitionIssue(issueKey, transition.id);
        return;
      }
    }
  }
}

/**
 * Map Sognatore status to Jira transition name.
 */
export function mapSognatoreStatusToJira(sognatoreStatus: string): string | null {
  return STATUS_MAP[sognatoreStatus?.toLowerCase()] || null;
}
