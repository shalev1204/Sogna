import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GitHubReportOptions {
  eventName: string;
  payload: any;
  status: 'success' | 'failure' | 'unknown';
  executionId: string;
  repository: string;
  sha?: string;
  serverUrl: string;
  runId: string;
  token: string;
  reportsPath?: string;
}

export interface SognatoreReport {
  qualityGates: any[];
  tasksCompleted: number;
  tasksFailed: number;
  totalTasks: number;
  duration: string;
  deploymentUrl: string | null;
  summary: string;
}

/**
 * Modernized GitHub Results Reporter.
 */
export class GitHubReporter {
  private options: GitHubReportOptions;

  constructor(options: GitHubReportOptions) {
    if (!options.token) {
      throw new Error('GitHub token is required. Set GITHUB_TOKEN or provide a PAT.');
    }
    this.options = options;
  }

  public async postResults(): Promise<void> {
    const report = this.loadReport(this.options.reportsPath);

    switch (this.options.eventName) {
      case 'pull_request_review':
        await this.postPrComment(report);
        await this.createStatusCheck(report);
        break;
      case 'issues':
        await this.postIssueComment(report);
        break;
      case 'workflow_dispatch':
      case 'schedule':
        await this.createStatusCheck(report);
        break;
      default:
        console.log('No reporting action for event:', this.options.eventName);
    }
  }

  private async postPrComment(report: SognatoreReport): Promise<void> {
    const pr = this.options.payload?.pull_request || {};
    const prNumber = pr.number;

    if (!prNumber) {
      console.log('No PR number found in payload, skipping PR comment.');
      return;
    }

    const body = this.renderQualityReport(report);
    const [owner, repo] = this.options.repository.split('/');

    await this.githubApiRequest({
      method: 'POST',
      path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      body: { body },
    });

    console.log(`Posted quality report to PR #${prNumber}`);
  }

  private async postIssueComment(report: SognatoreReport): Promise<void> {
    const issue = this.options.payload?.issue || {};
    const issueNumber = issue.number;

    if (!issueNumber) {
      console.log('No issue number found in payload, skipping issue comment.');
      return;
    }

    const body = this.renderExecutionSummary(report);
    const [owner, repo] = this.options.repository.split('/');

    await this.githubApiRequest({
      method: 'POST',
      path: `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      body: { body },
    });

    console.log(`Posted execution summary to issue #${issueNumber}`);
  }

  private async createStatusCheck(report: SognatoreReport): Promise<void> {
    const sha = this.options.sha;
    if (!sha) {
      console.log('No SHA available, skipping status check.');
      return;
    }

    const [owner, repo] = this.options.repository.split('/');
    const state = this.options.status === 'success' ? 'success' : 'failure';
    const description = this.options.status === 'success'
      ? 'Sognatore execution completed successfully'
      : 'Sognatore execution completed with errors';

    const targetUrl = `${this.options.serverUrl}/${this.options.repository}/actions/runs/${this.options.runId}`;

    await this.githubApiRequest({
      method: 'POST',
      path: `/repos/${owner}/${repo}/statuses/${sha}`,
      body: {
        state,
        target_url: targetUrl,
        description,
        context: 'sognatore/enterprise',
      },
    });

    console.log(`Created status check on commit ${sha.substring(0, 7)}: ${state}`);
  }

  private loadReport(reportsPath?: string): SognatoreReport {
    const report: SognatoreReport = {
      qualityGates: [],
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTasks: 0,
      duration: 'unknown',
      deploymentUrl: null,
      summary: 'No detailed report available.',
    };

    if (!reportsPath) return report;

    // Try to load quality gate results
    const qualityPath = path.join(reportsPath, 'quality-gates.json');
    if (fs.existsSync(qualityPath)) {
      try {
        const qualityData = JSON.parse(fs.readFileSync(qualityPath, 'utf8'));
        report.qualityGates = qualityData.gates || qualityData || [];
      } catch (e: any) {
        console.log(`Warning: Could not parse quality-gates.json: ${e.message}`);
      }
    }

    // Try to load execution summary
    const summaryPath = path.join(reportsPath, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        report.tasksCompleted = summaryData.tasksCompleted || 0;
        report.tasksFailed = summaryData.tasksFailed || 0;
        report.totalTasks = summaryData.totalTasks || 0;
        report.duration = summaryData.duration || 'unknown';
        report.deploymentUrl = summaryData.deploymentUrl || null;
        report.summary = summaryData.summary || report.summary;
      } catch (e: any) {
        console.log(`Warning: Could not parse summary.json: ${e.message}`);
      }
    }

    return report;
  }

  private renderQualityReport(report: SognatoreReport): string {
    const templatePath = path.join(__dirname, 'templates', 'quality-report.md');
    const template = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf8')
      : this.getDefaultQualityReportTemplate();

    return this.applyTemplate(template, report);
  }

  private renderExecutionSummary(report: SognatoreReport): string {
    const templatePath = path.join(__dirname, 'templates', 'execution-summary.md');
    const template = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf8')
      : this.getDefaultExecutionSummaryTemplate();

    return this.applyTemplate(template, report);
  }

  private escapeMarkdown(value: any, multiline = false): string {
    if (typeof value !== 'string') return String(value);
    
    let escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    
    if (!multiline) {
      escaped = escaped.replace(/[\r\n]+/g, ' ');
    }
    return escaped;
  }

  private isSafeUrl(url: string | null): boolean {
    return typeof url === 'string' && /^https:\/\//i.test(url);
  }

  private applyTemplate(template: string, report: SognatoreReport): string {
    const statusLabel = this.options.status === 'success' ? 'PASS' : 'FAIL';

    let gatesRows: string;
    if (Array.isArray(report.qualityGates) && report.qualityGates.length > 0) {
      gatesRows = report.qualityGates.map((gate) => {
        const gateStatus = gate.passed ? 'PASS' : 'FAIL';
        return `| ${this.escapeMarkdown(gate.name || 'Unknown')} | ${gateStatus} | ${this.escapeMarkdown(gate.details || '-')} |`;
      }).join('\n');
    } else {
      gatesRows = '| No quality gate data available | - | - |';
    }

    let deploymentLine = 'N/A';
    if (report.deploymentUrl && this.isSafeUrl(report.deploymentUrl)) {
      deploymentLine = `[View Deployment](${report.deploymentUrl})`;
    } else if (report.deploymentUrl) {
      deploymentLine = this.escapeMarkdown(report.deploymentUrl);
    }

    const runUrl = `${this.options.serverUrl}/${this.options.repository}/actions/runs/${this.options.runId}`;

    const replacements: Record<string, string> = {
      '{{STATUS}}': statusLabel,
      '{{EXECUTION_ID}}': this.escapeMarkdown(this.options.executionId || 'unknown'),
      '{{TASKS_COMPLETED}}': String(report.tasksCompleted),
      '{{TASKS_FAILED}}': String(report.tasksFailed),
      '{{TOTAL_TASKS}}': String(report.totalTasks),
      '{{DURATION}}': this.escapeMarkdown(report.duration || 'unknown'),
      '{{QUALITY_GATES_TABLE}}': gatesRows,
      '{{DEPLOYMENT_URL}}': deploymentLine,
      '{{RUN_URL}}': runUrl,
      '{{SUMMARY}}': this.escapeMarkdown(report.summary || 'No summary available.', true),
      '{{REPOSITORY}}': this.escapeMarkdown(this.options.repository || ''),
      '{{SHA}}': this.escapeMarkdown((this.options.sha || '').substring(0, 7)),
    };

    return template.replace(/\{\{[A-Z_]+\}\}/g, (key) => {
      return Object.prototype.hasOwnProperty.call(replacements, key)
        ? replacements[key]
        : key;
    });
  }

  private getDefaultQualityReportTemplate(): string {
    return [
      '## Sognatore Quality Report',
      '',
      '**Status:** {{STATUS}} | **Execution:** `{{EXECUTION_ID}}`',
      '',
      '### Quality Gates',
      '',
      '| Gate | Status | Details |',
      '|------|--------|---------|',
      '{{QUALITY_GATES_TABLE}}',
      '',
      '### Summary',
      '',
      '- Tasks: {{TASKS_COMPLETED}}/{{TOTAL_TASKS}} completed, {{TASKS_FAILED}} failed',
      '- Duration: {{DURATION}}',
      '- Deployment: {{DEPLOYMENT_URL}}',
      '',
      '---',
      '[View full run]({{RUN_URL}}) | Commit: `{{SHA}}`',
    ].join('\n');
  }

  private getDefaultExecutionSummaryTemplate(): string {
    return [
      '## Sognatore Execution Summary',
      '',
      '**Status:** {{STATUS}} | **Execution:** `{{EXECUTION_ID}}`',
      '',
      '### Results',
      '',
      '{{SUMMARY}}',
      '',
      '### Metrics',
      '',
      '- Tasks completed: {{TASKS_COMPLETED}}/{{TOTAL_TASKS}}',
      '- Tasks failed: {{TASKS_FAILED}}',
      '- Duration: {{DURATION}}',
      '',
      '---',
      '[View full run]({{RUN_URL}})',
    ].join('\n');
  }

  private async githubApiRequest(opts: { method: string; path: string; body?: any }): Promise<any> {
    const url = `https://api.github.com${opts.path}`;
    const response = await fetch(url, {
      method: opts.method,
      headers: {
        'Authorization': `token ${this.options.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'sognatore-enterprise',
        'Content-Type': 'application/json',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${text}`);
    }

    if (response.status === 204) return {};
    return response.json();
  }
}
