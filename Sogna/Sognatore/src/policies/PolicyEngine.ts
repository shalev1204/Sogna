import * as fs from 'fs';
import * as path from 'path';
import { 
  Decision, 
  evaluateRule, 
  scanContent, 
  validatePreExecution,
  validatePreDeployment,
  validateResource,
  validateData,
  validateApprovalGate,
  RULE_EVALUATORS 
} from './PolicyTypes.js';

/**
 * Sognatore Policy Engine - Core Evaluation Engine
 */

export function parseSimpleYaml(text: string): any {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  return _parseBlock(lines, 0, 0).value;
}

function _parseBlock(lines: string[], startIdx: number, baseIndent: number): { value: any, endIdx: number } {
  const result: any = {};
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const indent = line.length - trimmed.length;
    if (indent < baseIndent) break;
    if (indent > baseIndent && i > startIdx) break;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = trimmed.substring(0, colonIdx).trim();
    const rawValue = trimmed.substring(colonIdx + 1).trim();

    if (rawValue === '' || rawValue === '|' || rawValue === '>') {
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;

      if (nextIdx < lines.length) {
        const nextTrimmed = lines[nextIdx].trimStart();
        const nextIndent = lines[nextIdx].length - nextTrimmed.length;

        if (nextIndent > indent && nextTrimmed.startsWith('- ')) {
          const arr = _parseArray(lines, nextIdx, nextIndent);
          result[key] = arr.value;
          i = arr.endIdx;
          continue;
        } else if (nextIndent > indent) {
          const nested = _parseBlock(lines, nextIdx, nextIndent);
          result[key] = nested.value;
          i = nested.endIdx;
          continue;
        }
      }
      result[key] = rawValue || null;
      i++;
    } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      const inner = rawValue.substring(1, rawValue.length - 1);
      result[key] = inner.split(',').map(s => _parseScalar(s.trim()));
      i++;
    } else {
      result[key] = _parseScalar(rawValue);
      i++;
    }
  }

  return { value: result, endIdx: i };
}

function _parseArray(lines: string[], startIdx: number, baseIndent: number): { value: any[], endIdx: number } {
  const result: any[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const indent = line.length - trimmed.length;
    if (indent < baseIndent) break;
    if (!trimmed.startsWith('- ')) break;

    const itemContent = trimmed.substring(2).trim();
    const colonIdx = itemContent.indexOf(':');

    if (colonIdx === -1) {
      result.push(_parseScalar(itemContent));
      i++;
    } else {
      const firstKey = itemContent.substring(0, colonIdx).trim();
      const firstVal = itemContent.substring(colonIdx + 1).trim();
      const obj: any = {};
      
      if (firstVal.startsWith('[') && firstVal.endsWith(']')) {
        const inner = firstVal.substring(1, firstVal.length - 1);
        obj[firstKey] = inner.split(',').map(s => _parseScalar(s.trim()));
      } else {
        obj[firstKey] = _parseScalar(firstVal);
      }
      i++;

      const itemIndent = indent + 2;
      while (i < lines.length) {
        const subLine = lines[i];
        const subTrimmed = subLine.trimStart();
        if (!subTrimmed || subTrimmed.startsWith('#')) {
          i++;
          continue;
        }
        const subIndent = subLine.length - subTrimmed.length;
        if (subIndent < itemIndent) break;

        const subColonIdx = subTrimmed.indexOf(':');
        if (subColonIdx === -1) {
          i++;
          continue;
        }
        const subKey = subTrimmed.substring(0, subColonIdx).trim();
        const subVal = subTrimmed.substring(subColonIdx + 1).trim();
        
        if (subVal.startsWith('[') && subVal.endsWith(']')) {
          const inner2 = subVal.substring(1, subVal.length - 1);
          obj[subKey] = inner2.split(',').map(s => _parseScalar(s.trim()));
        } else {
          obj[subKey] = _parseScalar(subVal);
        }
        i++;
      }
      result.push(obj);
    }
  }

  return { value: result, endIdx: i };
}

function _parseScalar(v: string): any {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.substring(1, v.length - 1);
  }
  const n = Number(v);
  if (!isNaN(n) && v !== '') return n;
  return v;
}

export class PolicyEngine {
  private _projectDir: string;
  private _options: any;
  private _policies: any = null;
  private _policyPath: string | null = null;
  private _loaded = false;
  private _watcher: boolean = false;
  private _validationErrors: string[] = [];

  constructor(projectDir?: string, options?: any) {
    this._projectDir = projectDir || process.cwd();
    this._options = options || {};
    this._init();
  }

  private _init(): void {
    const sognatoreDir = path.join(this._projectDir, '.sognatore');
    const jsonPath = path.join(sognatoreDir, 'policies.json');
    const yamlPath = path.join(sognatoreDir, 'policies.yaml');

    if (fs.existsSync(jsonPath)) {
      this._policyPath = jsonPath;
    } else if (fs.existsSync(yamlPath)) {
      this._policyPath = yamlPath;
    } else {
      this._policies = null;
      this._loaded = true;
      return;
    }

    this._loadPolicies();

    if (this._options.watch) {
      this._startWatcher();
    }
  }

  private _loadPolicies(): void {
    if (!this._policyPath) return;

    try {
      const content = fs.readFileSync(this._policyPath, 'utf8');
      let parsed: any;

      if (this._policyPath.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else {
        parsed = parseSimpleYaml(content);
      }

      this._validationErrors = this._validatePolicies(parsed);
      this._policies = parsed;
      this._loaded = true;
    } catch (err: any) {
      this._validationErrors = [`Failed to load policy file: ${err.message}`];
      this._policies = null;
      this._loaded = true;
    }
  }

  private _validatePolicies(parsed: any): string[] {
    const errors: string[] = [];
    if (!parsed || typeof parsed !== 'object') {
      errors.push('Policy file must be a YAML/JSON object');
      return errors;
    }

    const policies = parsed.policies || parsed;
    const knownRuleKeys = Object.keys(RULE_EVALUATORS);

    const validateList = (list: any[], name: string, validator: (entry: any) => { valid: boolean; errors: string[] }) => {
      if (list && Array.isArray(list)) {
        list.forEach((entry, i) => {
          const result = validator(entry);
          if (!result.valid) {
            errors.push(`${name}[${i}]: ${result.errors.join(', ')}`);
          }
          if (name === 'pre_execution' && entry && typeof entry.rule === 'string') {
            const recognized = knownRuleKeys.some(k => entry.rule === k || entry.rule.startsWith(k));
            if (!recognized) {
              errors.push(`${name}[${i}]: warning: rule "${entry.rule}" is not recognized`);
            }
          }
        });
      }
    };

    validateList(policies.pre_execution, 'pre_execution', validatePreExecution);
    validateList(policies.pre_deployment, 'pre_deployment', validatePreDeployment);
    validateList(policies.resource, 'resource', validateResource);
    validateList(policies.data, 'data', validateData);
    validateList(policies.approval_gates, 'approval_gates', validateApprovalGate);

    return errors;
  }

  private _startWatcher(): void {
    if (!this._policyPath || this._watcher) return;
    fs.watchFile(this._policyPath, { interval: 1000 }, () => {
      this._loadPolicies();
    });
    this._watcher = true;
  }

  public evaluate(enforcementPoint: string, context: any): any {
    if (!this._policies) {
      return {
        allowed: true,
        decision: Decision.ALLOW,
        reason: 'No policies configured',
        requiresApproval: false,
        violations: [],
      };
    }

    const policies = this._policies.policies || this._policies;
    const entries = policies[enforcementPoint];

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return {
        allowed: true,
        decision: Decision.ALLOW,
        reason: `No policies defined for ${enforcementPoint}`,
        requiresApproval: false,
        violations: [],
      };
    }

    const ctx = context || {};
    const violations: any[] = [];

    switch (enforcementPoint) {
      case 'pre_execution':
        this._evaluatePreExecution(entries, ctx, violations);
        break;
      case 'pre_deployment':
        this._evaluatePreDeployment(entries, ctx, violations);
        break;
      case 'resource':
        this._evaluateResource(entries, ctx, violations);
        break;
      case 'data':
        this._evaluateData(entries, ctx, violations);
        break;
      default:
        return {
          allowed: true,
          decision: Decision.ALLOW,
          reason: `Unknown enforcement point: ${enforcementPoint}`,
          requiresApproval: false,
          violations: [],
        };
    }

    const requiresApproval = violations.some(v => v.action === 'require_approval');
    const denied = violations.some(v => v.action === 'deny');

    if (denied) {
      return {
        allowed: false,
        decision: Decision.DENY,
        reason: violations.map(v => `${v.name}: ${v.reason}`).join('; '),
        requiresApproval: false,
        violations,
      };
    }

    if (requiresApproval) {
      return {
        allowed: false,
        decision: Decision.REQUIRE_APPROVAL,
        reason: violations.map(v => `${v.name}: ${v.reason}`).join('; '),
        requiresApproval: true,
        violations,
      };
    }

    return {
      allowed: true,
      decision: Decision.ALLOW,
      reason: 'All policies passed',
      requiresApproval: false,
      violations: [],
    };
  }

  private _evaluatePreExecution(entries: any[], context: any, violations: any[]): void {
    for (const entry of entries) {
      const result = evaluateRule(entry.rule, context);
      if (result === false) {
        violations.push({
          name: entry.name,
          action: entry.action || 'deny',
          reason: `Rule violated: ${entry.rule}`,
        });
      }
    }
  }

  private _evaluatePreDeployment(entries: any[], context: any, violations: any[]): void {
    const passedGates = context.passed_gates || [];
    for (const entry of entries) {
      if (!entry.gates || !Array.isArray(entry.gates)) continue;
      for (const gate of entry.gates) {
        if (!passedGates.includes(gate)) {
          violations.push({
            name: entry.name,
            action: entry.action || 'deny',
            reason: `Required gate not passed: ${gate}`,
          });
        }
      }
    }
  }

  private _evaluateResource(entries: any[], context: any, violations: any[]): void {
    for (const entry of entries) {
      if (entry.providers && Array.isArray(entry.providers)) {
        if (context.provider && !entry.providers.includes(context.provider)) {
          violations.push({
            name: entry.name,
            action: entry.action || 'deny',
            reason: `Provider "${context.provider}" not approved`,
          });
        }
      }
      if (entry.max_tokens && context.tokens_consumed !== undefined) {
        if (context.tokens_consumed >= entry.max_tokens) {
          violations.push({
            name: entry.name,
            action: entry.on_exceed === 'require_approval' ? 'require_approval' : 'deny',
            reason: `Token budget exceeded: ${context.tokens_consumed} >= ${entry.max_tokens}`,
          });
        }
      }
    }
  }

  private _evaluateData(entries: any[], context: any, violations: any[]): void {
    if (!context.content) return;
    for (const entry of entries) {
      const findings = scanContent(context.content, entry.type);
      if (findings.length > 0) {
        violations.push({
          name: entry.name,
          action: entry.action || 'deny',
          reason: `${entry.type} detected`,
          findings,
        });
      }
    }
  }

  public getApprovalGates(): any[] {
    const policies = this._policies?.policies || this._policies;
    return policies?.approval_gates || [];
  }

  public getResourcePolicies(): any[] {
    const policies = this._policies?.policies || this._policies;
    return policies?.resource || [];
  }

  public hasPolicies(): boolean {
    return this._policies !== null;
  }

  public getValidationErrors(): string[] {
    return this._validationErrors;
  }

  public destroy(): void {
    if (this._watcher && this._policyPath) {
      fs.unwatchFile(this._policyPath);
      this._watcher = false;
    }
  }

  public reload(): void {
    this._loadPolicies();
  }
}
