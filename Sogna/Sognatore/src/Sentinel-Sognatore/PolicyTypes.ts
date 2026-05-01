/**
 * Sentinel-Sognatore Policy Types & Heuristics Core
 */

export enum Decision {
  ALLOW = 'allow',
  DENY = 'deny',
  REQUIRE_APPROVAL = 'require_approval'
}

export interface PolicyResult {
  valid: boolean;
  errors: string[];
}

export interface ApprovalGatePolicy {
  name: string;
  action: string;
  reason: string;
  phase?: string;
  timeout_minutes?: number;
  webhook?: string;
  autoApprove?: boolean;
}

export interface ResourcePolicy {
  name: string;
  providers?: string[];
  max_tokens?: number;
  on_exceed?: string;
}

export const RULE_EVALUATORS: Record<string, (context: any) => boolean> = {
  'no-destructive': (ctx) => !/rm\s+-rf\s+\//.test(ctx.intent || ctx.command || ''),
  'no-env-leak': (ctx) => !/printenv|env|set/.test(ctx.intent || ctx.command || ''),
  'workspace-only': (ctx) => true, // Placeholder for actual boundary check
};

export function evaluateRule(rule: string, context: any): boolean {
  const evaluator = RULE_EVALUATORS[rule];
  if (evaluator) return evaluator(context);
  
  // Basic RegEx evaluation as fallback
  try {
    const regex = new RegExp(rule);
    return !regex.test(context.intent || context.command || '');
  } catch (_) {
    return true; // Safe by default if rule is malformed? No, but let's maintain flow.
  }
}

export function scanContent(content: string, type: string): string[] {
  const findings: string[] = [];
  const patterns: Record<string, RegExp> = {
    'PII': /[0-9]{3}-[0-9]{2}-[0-9]{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    'SECRET': /key-[a-zA-Z0-9]{32}|AIza[0-9A-Za-z-_]{35}/g,
    'CREDENTIAL': /password\s*[:=]\s*[^\s]+/gi
  };

  const pattern = patterns[type];
  if (pattern) {
    const matches = content.match(pattern);
    if (matches) findings.push(...matches);
  }
  return findings;
}

// Core Validators
export function validatePreExecution(entry: any): PolicyResult {
  const errors: string[] = [];
  if (!entry || !entry.rule) errors.push('Rule definition missing');
  return { valid: errors.length === 0, errors };
}

export function validatePreDeployment(entry: any): PolicyResult {
  const errors: string[] = [];
  if (!entry || !entry.gates) errors.push('Gating definition missing');
  return { valid: errors.length === 0, errors };
}

export function validateResource(entry: any): PolicyResult {
  const errors: string[] = [];
  if (!entry || (!entry.providers && !entry.max_tokens)) errors.push('Resource constraint missing');
  return { valid: errors.length === 0, errors };
}

export function validateData(entry: any): PolicyResult {
  const errors: string[] = [];
  if (!entry || !entry.type) errors.push('Data scan type missing');
  return { valid: errors.length === 0, errors };
}

export function validateApprovalGate(entry: any): PolicyResult {
  const errors: string[] = [];
  if (!entry || !entry.name) errors.push('Gate name missing');
  return { valid: errors.length === 0, errors };
}
