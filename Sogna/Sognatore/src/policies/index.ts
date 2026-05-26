import { Engine } from '../Sentinel-Sognatore/Engine.js';
import { Gates } from '../Sentinel-Sognatore/Gates.js';
import { Treasurer } from '../Sentinel-Sognatore/Treasurer.js';
import { Decision } from '../Sentinel-Sognatore/PolicyTypes.js';

/**
 * Sentinel-Sognatore Policy API - Unified Entry Point
 */

let _engine: Engine | null = null;
let _gates: Gates | null = null;
let _treasurer: Treasurer | null = null;
let _initialized = false;
let _projectDir: string | null = null;

/**
 * Initialize the sentinel-sognatore policy block.
 */
export function init(projectDir?: string, options?: any): void {
  const dir = projectDir || process.cwd();
  if (_initialized && _projectDir === dir) return;

  destroy();

  _projectDir = dir;
  _engine = new Engine(dir, options);

  if (_engine.hasPolicies()) {
    _gates = new Gates(dir, _engine.getApprovalGates());
    _treasurer = new Treasurer(dir, _engine.getResourcePolicies());
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
  if (!_treasurer) {
    return { remaining: Infinity, percentage: 0, alerts: [], exceeded: false };
  }
  return _treasurer.checkBudget(projectId);
}

/**
 * Record token usage for cost tracking.
 */
export function recordUsage(projectId: string, usage: any): void {
  _ensureInit();
  if (_treasurer) {
    _treasurer.recordUsage(projectId, usage);
  }
}

/**
 * Request approval for a gate phase.
 */
export function requestApproval(phase: string, context?: any): Promise<any> {
  _ensureInit();
  if (!_gates) {
    return Promise.resolve({
      approved: true,
      reason: 'No policies configured',
      method: 'auto',
    });
  }
  return _gates.requestApproval(phase, context);
}

/**
 * Resolve a pending approval request externally.
 */
export function resolveApproval(requestId: string, approved: boolean, reason?: string): boolean {
  _ensureInit();
  if (!_gates) return false;
  return _gates.resolveApproval(requestId, approved, reason);
}

/**
 * Check if the engine has policies loaded.
 */
export function hasPolicies(): boolean {
  _ensureInit();
  return _engine!.hasPolicies();
}

/**
 * Get the treasurer instance.
 */
export function getCostController(): Treasurer | null {
  _ensureInit();
  return _treasurer;
}

/**
 * Get the gates manager instance.
 */
export function getApprovalManager(): Gates | null {
  _ensureInit();
  return _gates;
}

/**
 * Destroy all instances and clean up resources.
 */
export function destroy(): void {
  if (_engine) {
    _engine.destroy();
    _engine = null;
  }
  if (_gates) {
    _gates.destroy();
    _gates = null;
  }
  if (_treasurer) {
    _treasurer.destroy();
    _treasurer = null;
  }
  _initialized = false;
  _projectDir = null;
}

export { Decision };

