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
  RULE_EVALUATORS,
  PolicyStructure,
  SecurityContext,
  PreExecutionPolicy,
  PreDeploymentPolicy,
  ResourcePolicy,
  DataPolicy,
  ApprovalGatePolicy
} from './PolicyTypes.js';
import { PermissionMode } from './SecurityTypes.js';
// @Sentinel-ignore: Justificación técnica
import { spawnSync } from 'child_process';
import { Hub, SecurityState } from './Hub.js';
import { Honeypots } from './Honeypots.js';
import { MemoryHub } from '../core/memory/MemoryHub.js';
import { SecurityAudit } from './SecurityAudit.js';
import { ActivityProfile } from './ActivityProfile.js';

/**
 * Sognatore Policy Engine - Core Evaluation Engine
 */

type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

export function parseSimpleYaml(text: string): YamlValue {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  return _parseBlock(lines, 0, 0).value;
}

function _parseBlock(lines: string[], startIdx: number, baseIndent: number): { value: Record<string, YamlValue>, endIdx: number } {
  const result: Record<string, YamlValue> = {};
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

function _parseArray(lines: string[], startIdx: number, baseIndent: number): { value: YamlValue[], endIdx: number } {
  const result: YamlValue[] = [];
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

function _parseScalar(v: string): YamlValue {
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

export class Engine {
  private static instance: Engine | null = null;
  private _projectDir: string;
  private _options: Record<string, unknown>;
  private _policies: PolicyStructure | null = null;
  private _policyPath: string | null = null;
  private _loaded = false;
  private _watcher: boolean = false;
  private _validationErrors: string[] = [];
  private static _globalMode: PermissionMode = PermissionMode.Balanced;
  private _executiveBinaryPath: string;
  private _threatL1Cache: Map<string, { decision: Decision; reason: string; timestamp: number }> = new Map();
  private readonly THREAT_CACHE_TTL = 300000; // 5 minutes

  public static getInstance(projectDir?: string, options?: Record<string, unknown>): Engine {
    if (!this.instance) {
      this.instance = new Engine(projectDir, options);
    }
    return this.instance;
  }
  private _honeypotSet: Set<string> = new Set();

  public static setGlobalMode(mode: string): void {
    const m = mode.toLowerCase();
    if (m === 'readonly') this._globalMode = PermissionMode.ReadOnly;
    else if (m === 'full') this._globalMode = PermissionMode.Full;
    else this._globalMode = PermissionMode.Balanced;
  }

  public static getGlobalMode(): PermissionMode {
    return this._globalMode;
  }

  constructor(projectDir?: string, options?: Record<string, unknown>) {
    this._projectDir = projectDir || process.cwd();
    this._options = options || {};
    this._executiveBinaryPath = path.resolve(this._projectDir, 'toolkit/executive-core/target/release/executive-core.exe');
    
    // PRE-PROCESSING HONEYPOTS (O(1) Latency Optimization)
    const hpManager = new Honeypots(this._projectDir);
    const hps = hpManager.getHoneypotPaths();
    for (const hp of hps) {
      const absPath = path.resolve(this._projectDir, hp);
      this._honeypotSet.add(absPath);
    }

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
      const fallbackPath = path.resolve(this._projectDir, 'toolkit/engines/Sentinel/data/security.json');
      if (fs.existsSync(fallbackPath)) {
        this._policyPath = fallbackPath;
      } else {
        this._policies = null;
        this._loaded = true;
        return;
      }
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

  public dispose(): void {
    if (this._policyPath && this._watcher) {
      fs.unwatchFile(this._policyPath);
      this._watcher = false;
    }
  }

  private async _evaluateMemoryPatterns(context: any, violations: any[]): Promise<void> {
    const intent = context.intent || context.command || '';
    if (!intent) return;

    try {
      const hub = MemoryHub.getInstance();
      const memories = await hub.unifiedRecall(intent);
      
      // Look for high-relevance immunological or episodic threats
      const threatMatches = memories.filter(m => 
        (m.source === 'immunological' || m.source === 'episodic') && 
        m.relevance >= 1.0 && 
        (m.metadata?.tags?.includes('#threat') || m.content.toLowerCase().includes('veto'))
      );

      if (threatMatches.length > 0) {
        violations.push({
          name: 'MemoryGate',
          action: 'deny',
          reason: `Task intent resembles a previously blocked attack pattern: ${threatMatches[0].key}`,
          metadata: { matches: threatMatches.length }
        });
      }
    } catch (error) {
      console.warn('[POLICY_ENGINE] Failed to query MemoryHub for patterns:', error);
    }
  }

  public evaluate(enforcementPoint: string, context: any): any {
    const ctx = context || {};
    const violations: any[] = [];
    
    // 0. L1 THREAT CACHE: Instant denial for repeated attacks
    const threatKey = `${enforcementPoint}:${ctx.intent || ctx.command || 'none'}`;
    const cachedThreat = this._threatL1Cache.get(threatKey);
    if (cachedThreat && (Date.now() - cachedThreat.timestamp < this.THREAT_CACHE_TTL)) {
      return {
        allowed: false,
        decision: cachedThreat.decision,
        reason: `[L1_CACHE] ${cachedThreat.reason}`,
        requiresApproval: false,
        violations: [{ name: 'ThreatL1Gate', action: 'deny', reason: cachedThreat.reason }],
      };
    }

    // PROACTIVE SECURITY GATE: Check Sentinel Pulse and Unified Memory
    // This allows Sentinel to learn from experience without manual rule updates.
    const hub = Hub.getInstance();
    if (hub.getState() === SecurityState.PANIC) {
        const panicEvent = {
            name: 'SentinelPanicGate',
            action: 'deny',
            reason: 'System is in PANIC MODE (Sentinel unresponsive). Only ReadOnly operations allowed.'
        };
        hub.reportIntel('CRITICAL', 'Bloqueo por Modo Pánico (Sentinel desconectado)', enforcementPoint);
        violations.push(panicEvent);
    }

    this._evaluateMemoryPatterns(ctx, violations);

    // 2. BEHAVIORAL ANALYSIS: Detect hijacking/bursts
    const isSensitive = enforcementPoint === 'pre_execution' && ctx.sensitive;
    const behavioralResult = ActivityProfile.getInstance().analyzeActivity(ctx.command || ctx.intent || 'unknown', isSensitive);
    if (behavioralResult.isAnomalous) {
      const reason = `ANOMALÍA DE COMPORTAMIENTO: ${behavioralResult.reason}`;
      hub.reportIntel('WARNING', reason, 'ActivityProfile');
      violations.push({ name: 'ActivityGate', action: 'require_approval', reason });
    }

    // 3. HONEYPOT INTERCEPTION
    const targetPath = ctx.path || ctx.arguments?.path || ctx.arguments?.filePath;
    if (targetPath) {
      const absTarget = path.resolve(this._projectDir, targetPath);
      if (this._honeypotSet.has(absTarget)) {
        const reason = `BRECHA DE SEGURIDAD DETECTADA: Interacción física con Honeypot (${path.basename(absTarget)})`;
        hub.triggerPanic(reason, 'Honeypot Engine', ctx.agentPid);
        violations.push({ name: 'HoneypotGate', action: 'deny', reason });
      }
    }

    // 4. EXECUTIVE CORE (Hard Gate)
    if (enforcementPoint === 'pre_execution' && ctx.sensitive) {
      const executiveResult = this._callExecutiveCore(ctx);
      if (executiveResult.decision === Decision.DENY) {
        violations.push({ name: 'ExecutiveProtocol', action: 'deny', reason: executiveResult.reason });
      }
    }

    // 5. LOCAL POLICIES
    if (this._policies) {
      switch (enforcementPoint) {
        case 'pre_execution':
          this._evaluatePreExecution(this._policies.pre_execution || [], ctx, violations);
          break;
        case 'pre_deployment':
          this._evaluatePreDeployment(this._policies.pre_deployment || [], ctx, violations);
          break;
        case 'resource':
          this._evaluateResource(this._policies.resource || [], ctx, violations);
          break;
        case 'data':
          this._evaluateData(this._policies.data || [], ctx, violations);
          break;
      }
    }

    // 6. FINAL VERDICT & AUDIT
    const requiresApproval = violations.some(v => v.action === 'require_approval');
    const denied = violations.some(v => v.action === 'deny');
    const finalDecision = denied ? Decision.DENY : (requiresApproval ? Decision.REQUIRE_APPROVAL : Decision.ALLOW);
    const reasons = violations.length > 0 ? violations.map(v => `${v.name}: ${v.reason}`).join('; ') : 'All policies passed';

    // Sign the decision
    SecurityAudit.getInstance(this._projectDir).logDecision(
      enforcementPoint, 
      finalDecision, 
      reasons,
      { command: ctx.command, intent: ctx.intent, category: (ctx as any).category }
    );

    // Update L1 Cache if denied
    if (denied) {
      const threatKey = `${enforcementPoint}:${ctx.intent || ctx.command || 'none'}`;
      this._threatL1Cache.set(threatKey, { decision: Decision.DENY, reason: reasons, timestamp: Date.now() });
    }

    return {
      allowed: !denied,
      decision: finalDecision,
      reason: reasons,
      requiresApproval,
      violations,
    };
  }

  private _evaluatePreExecution(entries: PreExecutionPolicy[], context: SecurityContext, violations: { name: string, action: Decision, reason: string }[]): void {
    for (const entry of entries) {
      const result = evaluateRule(entry.rule, context);
      if (result === false) {
        violations.push({
          name: entry.name,
          action: entry.action || Decision.DENY,
          reason: `Rule violated: ${entry.rule}`,
        });
      }
    }
  }

  private _evaluatePreDeployment(entries: PreDeploymentPolicy[], context: SecurityContext, violations: { name: string, action: Decision, reason: string }[]): void {
    const passedGates = (context.passed_gates as string[]) || [];
    for (const entry of entries) {
      if (!entry.gates || !Array.isArray(entry.gates)) continue;
      for (const gate of entry.gates) {
        if (!passedGates.includes(gate)) {
          violations.push({
            name: entry.name,
            action: entry.action || Decision.DENY,
            reason: `Required gate not passed: ${gate}`,
          });
        }
      }
    }
  }

  private _evaluateResource(entries: ResourcePolicy[], context: SecurityContext, violations: { name: string, action: Decision, reason: string }[]): void {
    for (const entry of entries) {
      if (entry.providers && Array.isArray(entry.providers)) {
        if (context.provider && !entry.providers.includes(context.provider)) {
          violations.push({
            name: entry.name,
            action: Decision.DENY, // Resource provider mismatch is always deny
            reason: `Provider "${context.provider}" not approved`,
          });
        }
      }
      if (entry.max_tokens && context.tokens_consumed !== undefined) {
        if (context.tokens_consumed >= entry.max_tokens) {
          violations.push({
            name: entry.name,
            action: entry.on_exceed === 'require_approval' ? Decision.REQUIRE_APPROVAL : Decision.DENY,
            reason: `Token budget exceeded: ${context.tokens_consumed} >= ${entry.max_tokens}`,
          });
        }
      }
    }
  }

  private _evaluateData(entries: DataPolicy[], context: SecurityContext, violations: { name: string, action: Decision, reason: string, findings?: string[] }[]): void {
    if (!context.content) return;
    for (const entry of entries) {
      const findings = scanContent(context.content, entry.type);
      if (findings.length > 0) {
        violations.push({
          name: entry.name,
          action: entry.action || Decision.DENY,
          reason: `${entry.type} detected`,
          findings,
        });
      }
    }
  }

  private _callExecutiveCore(context: SecurityContext): { decision: Decision; reason: string } {
    const cargoContext = {
      tool_name: context.tool_name || 'policy_eval',
      arguments: context.arguments || {},
      trust_score: context.trust_score || 0.5,
      dynamic_rules: this._policies,
    };

    try {
// @Sentinel-ignore: Justificación técnica
      const result = spawnSync(this._executiveBinaryPath, [], {
        input: JSON.stringify(cargoContext),
        encoding: 'utf8',
      });

      if (result.error) throw result.error;
      const evaluation = JSON.parse(result.stdout);
      
      // Map Rust strings to Decision enum
      let decision = Decision.ALLOW;
      if (evaluation.decision === 'Deny') decision = Decision.DENY;
      if (evaluation.decision === 'RequireApproval') decision = Decision.REQUIRE_APPROVAL;

      return { decision, reason: evaluation.reason };
    } catch (err: any) {
      return { decision: Decision.ALLOW, reason: `Policy fallback: ${err.message}` };
    }
  }

  public getApprovalGates(): ApprovalGatePolicy[] {
    const policies = this._policies?.policies || this._policies;
    return policies?.approval_gates || [];
  }

  public getResourcePolicies(): ResourcePolicy[] {
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

  public validateCommand(command: string): { isSafe: boolean; category: string; violations: string[] } {
    const evaluation = this.evaluate('pre_execution', { command });
    
    // CORE CATEGORIZATION (SBP Alignment)
    let category = 'READ_ONLY';
    const cmdLower = command.toLowerCase();
    
    if (cmdLower.match(/\b(rm|rf|delete|drop|purge|wipe|format|truncate)\b/)) {
      category = 'DESTRUCTIVE';
    } else if (cmdLower.match(/\b(sudo|chmod|chown|root|passwd|shadow|visudo)\b/)) {
      category = 'DANGER_ZONE';
    } else if (cmdLower.match(/\b(deploy|publish|release|sync|push|production)\b/)) {
      category = 'deployment';
    } else if (cmdLower.match(/\b(apt|npm|yarn|pip|install|upgrade|update)\b/)) {
      category = 'system_modification';
    }

    return {
      isSafe: evaluation.allowed,
      category,
      violations: evaluation.violations.map((v: any) => v.reason || v.name)
    };
  }

  public reload(): void {
    this._loadPolicies();
  }
}

