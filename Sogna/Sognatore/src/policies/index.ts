import { PolicyEngine } from './PolicyEngine.js';
import { ApprovalGateManager } from './ApprovalGateManager.js';
import { CostController } from './CostController.js';
import { Decision } from './PolicyTypes.js';

/**
 * Sognatore Policy Engine - Public API
 */

let _engine: PolicyEngine | null = null;
let _approval: ApprovalGateManager | null = null;
let _cost: CostController | null = null;
let _initialized = false;
let _projectDir: string | null = null;

/**
 * Initialize the policy engine for a project directory.
 */
export function init(projectDir?: string, options?: any): void {
  const dir = projectDir || process.cwd();
  if (_initialized && _projectDir === dir) return;

  destroy();

  _projectDir = dir;
  _engine = new PolicyEngine(dir, options);

  if (_engine.hasPolicies()) {
    _approval = new ApprovalGateManager(dir, _engine.getApprovalGates());
    _cost = new CostController(dir, _engine.getResourcePolicies());
  }

  _initialized = true;
}

/**
 * Lazy initialization: ensures engine is created before any operation.
 */
function _ensureInit(): void {
  if (!_initialized) {
    init();
  }
}

/**
 * Evaluate policies for an action.
 */
export function evaluate(enforcementPoint: string, context: any): any {
  _ensureInit();
  return _engine!.evaluate(enforcementPoint, context);
}

/**
 * Check the budget status for a project.
 */
export function checkBudget(projectId?: string): any {
  _ensureInit();
  if (!_cost) {
    return { remaining: Infinity, percentage: 0, alerts: [], exceeded: false };
  }
  return _cost.checkBudget(projectId);
}

/**
 * Record token usage for cost tracking.
 */
export function recordUsage(projectId: string, usage: any): void {
  _ensureInit();
  if (_cost) {
    _cost.recordUsage(projectId, usage);
  }
}

/**
 * Request approval for a gate phase.
 */
export function requestApproval(phase: string, context?: any): Promise<any> {
  _ensureInit();
  if (!_approval) {
    return Promise.resolve({
      approved: true,
      reason: 'No policies configured',
      method: 'auto',
    });
  }
  return _approval.requestApproval(phase, context);
}

/**
 * Resolve a pending approval request externally.
 */
export function resolveApproval(requestId: string, approved: boolean, reason?: string): boolean {
  _ensureInit();
  if (!_approval) return false;
  return _approval.resolveApproval(requestId, approved, reason);
}

/**
 * Check if the engine has policies loaded.
 */
export function hasPolicies(): boolean {
  _ensureInit();
  return _engine!.hasPolicies();
}

/**
 * Get the cost controller instance.
 */
export function getCostController(): CostController | null {
  _ensureInit();
  return _cost;
}

/**
 * Get the approval manager instance.
 */
export function getApprovalManager(): ApprovalGateManager | null {
  _ensureInit();
  return _approval;
}

/**
 * Destroy all instances and clean up resources.
 */
export function destroy(): void {
  if (_engine) {
    _engine.destroy();
    _engine = null;
  }
  if (_approval) {
    _approval.destroy();
    _approval = null;
  }
  if (_cost) {
    _cost.removeAllListeners();
    _cost = null;
  }
  _initialized = false;
  _projectDir = null;
}

export { Decision };
