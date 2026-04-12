import path from 'path';

/**
 * Sognatore Policy Engine - Type Definitions and Validators
 */

export enum Decision {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
}

export interface PolicyEntry {
  name: string;
  action: 'deny' | 'allow' | 'require_approval' | 'shutdown' | 'warn';
  [key: string]: any;
}

export interface PreExecutionPolicy extends PolicyEntry {
  rule: string;
}

export interface PreDeploymentPolicy extends PolicyEntry {
  gates: string[];
}

export interface ResourcePolicy extends PolicyEntry {
  max_tokens?: number;
  alerts?: number[];
  on_exceed?: 'shutdown' | 'warn' | 'require_approval';
  providers?: string[];
}

export interface DataPolicy extends PolicyEntry {
  type: 'secret_detection' | 'pii_scanning';
  patterns?: string[];
}

export interface ApprovalGatePolicy extends PolicyEntry {
  phase: string;
  timeout_minutes?: number;
  webhook?: string;
}

export function validatePreExecution(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== 'object') {
    return { valid: false, errors: ['Entry must be an object'] };
  }
  if (typeof entry.name !== 'string' || entry.name.length === 0) {
    errors.push('name is required and must be a non-empty string');
  }
  if (typeof entry.rule !== 'string' || entry.rule.length === 0) {
    errors.push('rule is required and must be a non-empty string');
  }
  const validActions = ['deny', 'allow', 'require_approval'];
  if (!validActions.includes(entry.action)) {
    errors.push('action must be one of: ' + validActions.join(', '));
  }
  return { valid: errors.length === 0, errors };
}

export const RULE_EVALUATORS: Record<string, (context: any, rule?: string) => boolean | null> = {
  'file_path must start with project_dir': function (context) {
    if (!context.file_path || !context.project_dir) return null;
    const fp = path.resolve(String(context.file_path));
    const pd = path.resolve(String(context.project_dir));
    const base = pd.endsWith(path.sep) ? pd : pd + path.sep;
    return fp === pd || fp.startsWith(base);
  },

  'active_agents': function (context, rule) {
    if (context.active_agents === undefined || !rule) return null;
    const match = rule.match(/active_agents\s*<=\s*(\d+)/);
    if (!match) return null;
    const limit = parseInt(match[1], 10);
    return context.active_agents <= limit;
  },
};

export function evaluateRule(rule: string, context: any): boolean | null {
  if (!rule || !context) return null;

  if (RULE_EVALUATORS[rule]) {
    return RULE_EVALUATORS[rule](context);
  }

  for (const key of Object.keys(RULE_EVALUATORS)) {
    if (rule.startsWith(key)) {
      return RULE_EVALUATORS[key](context, rule);
    }
  }

  return null;
}

export const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}/i,
  /(?:secret|token|password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}/i,
  /(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*["']?[A-Za-z0-9/+=]{16,}/i,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9]{36}/,
  /sk-[A-Za-z0-9]{32,}/,
  /xoxb-[0-9]{10,}-[A-Za-z0-9]{20,}/,
];

export const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,  // SSN
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // Phone
  /\b(?:\d{4}[- ]?){3}\d{4}\b/,     // Credit card
];

export function scanContent(content: string, policyType: 'pii_scanning' | 'secret_detection'): Array<{ patternIndex: number; match: string }> {
  if (!content || typeof content !== 'string') return [];
  const patterns = policyType === 'pii_scanning' ? PII_PATTERNS : SECRET_PATTERNS;
  const findings: Array<{ patternIndex: number; match: string }> = [];
  for (let i = 0; i < patterns.length; i++) {
    const m = content.match(patterns[i]);
    if (m) {
      findings.push({ patternIndex: i, match: m[0].substring(0, 20) + '...' });
    }
  }
  return findings;
}

export function validatePreDeployment(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['Entry must be an object'] };
  if (typeof entry.name !== 'string' || entry.name.length === 0) errors.push('name is required');
  if (!entry.gates || !Array.isArray(entry.gates)) errors.push('gates list is required');
  return { valid: errors.length === 0, errors };
}

export function validateResource(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['Entry must be an object'] };
  if (typeof entry.name !== 'string' || entry.name.length === 0) errors.push('name is required');
  return { valid: errors.length === 0, errors };
}

export function validateData(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['Entry must be an object'] };
  if (typeof entry.name !== 'string' || entry.name.length === 0) errors.push('name is required');
  if (!['secret_detection', 'pii_scanning'].includes(entry.type)) errors.push('invalid data policy type');
  return { valid: errors.length === 0, errors };
}

export function validateApprovalGate(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['Entry must be an object'] };
  if (typeof entry.name !== 'string' || entry.name.length === 0) errors.push('name is required');
  if (typeof entry.phase !== 'string' || entry.phase.length === 0) errors.push('phase is required');
  return { valid: errors.length === 0, errors };
}
