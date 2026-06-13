import { Color, SognaEventBus, SognaEventType, FailureClass, EventProvenance } from '@Sogna/Curator';
import { Hub } from './Hub.js';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';


export type PermissionCapability = 'filesystem:read' | 'filesystem:write' | 'network:outbound' | 'process:execute' | 'identity:access';

export interface PermissionPolicy {
  allowedCapabilities: PermissionCapability[];
  autoApprove: boolean;
}

/**
 * Sentinel Permission Proxy - Production-Grade Access Control
 */
export class PermissionProxy {
  private static instance: PermissionProxy;
  private policies: Map<string, PermissionPolicy> = new Map();
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();
  private nextRequestId: number = 0;

  private constructor() {
    // Default System Policy
    this.policies.set('default', {
      allowedCapabilities: ['filesystem:read', 'identity:access'],
      autoApprove: false
    });
  }

  public static getInstance(): PermissionProxy {
    if (!PermissionProxy.instance) {
      PermissionProxy.instance = new PermissionProxy();
    }
    return PermissionProxy.instance;
  }

  public async requestApproval(agentId: string, capability: string, context: string): Promise<boolean> {
    const requestId = `hitl-${this.nextRequestId++}-${Date.now()}`;
    console.log(Color.yellow(`\n[HITL-GATE] Enjambre en pausa. Esperando veto/aprobación para [${capability}] en: ${context}`));

    SognaEventBus.getInstance().publish({
      type: SognaEventType.SUSPENSION,
      emitter: 'PermissionProxy',
      provenance: EventProvenance.LIVE,
      failureClass: FailureClass.PERMISSION,
      data: { requestId, agentId, capability, context }
    });

    return new Promise((resolve) => {
      // Default to deny on a 2 minute timeout to prevent hangs
      const timer = setTimeout(() => {
        if (this.pendingApprovals.has(requestId)) {
          this.pendingApprovals.delete(requestId);
          console.log(Color.red(`[HITL-TIMEOUT] Veto automático aplicado por falta de respuesta del Operador.`));
          resolve(false);
        }
      }, 120000);

      this.pendingApprovals.set(requestId, (approved: boolean) => {
        clearTimeout(timer);
        resolve(approved);
      });
    });
  }

  public resolveApproval(requestId: string, approved: boolean): void {
    const callback = this.pendingApprovals.get(requestId);
    if (callback) {
      this.pendingApprovals.delete(requestId);
      callback(approved);
    }
  }

  /**
   * Validates a capability request. 
   * In a real institutional environment, this would integrate with the Gates system.
   */
  public async requestCapability(agentId: string, capability: PermissionCapability, context: string): Promise<boolean> {
    const policy = this.policies.get(agentId) || this.policies.get('default')!;
    
    if (policy.allowedCapabilities.includes(capability)) {
      return true;
    }

    if (policy.autoApprove) {
      Hub.getInstance().reportIntel('INFO', `Auto-aprobando capacidad ${capability} para ${agentId}`, 'PermissionProxy');
      return true;
    }

    console.log(Color.bold.yellow(`\n[SECURITY-ALERT] Solicitando confirmación HITL para capacidad: ${capability}`));
    console.log(Color.yellow(`  Agente: ${agentId}`));
    console.log(Color.yellow(`  Contexto: ${context}`));

    const config = ConfigDiscovery.getInstance().getConfig();
    const hitlEnabled = config.governance?.require_human_approval_for_destructive_actions ?? true;

    if (hitlEnabled) {
      Hub.getInstance().reportIntel('WARNING', `HITL requerido para ${capability} de ${agentId}. Solicitando aprobación del Operador...`, 'PermissionProxy');
      const approved = await this.requestApproval(agentId, capability, context);
      if (approved) {
        Hub.getInstance().reportIntel('INFO', `Aprobación otorgada por el Operador para ${capability} de ${agentId}`, 'PermissionProxy');
        return true;
      }
    }

    Hub.getInstance().reportIntel('CRITICAL', `Denegada capacidad ${capability} para ${agentId}. Contexto: ${context}`, 'PermissionProxy');
    return false;
  }

  /**
   * Validates if a target path is allowed for filesystem read or write under `.sognarc.json` rules.
   */
  public async requestPathCapability(agentId: string, targetPath: string, capability: 'filesystem:read' | 'filesystem:write'): Promise<boolean> {
    const config = ConfigDiscovery.getInstance().getConfig();
    const allowedDirs: string[] = config.operational_bounds?.allowed_directories || ['.'];

    const resolvedTarget = path.resolve(targetPath);
    let canonicalTarget: string;
    try {
      canonicalTarget = fs.realpathSync(resolvedTarget);
    } catch {
      try {
        canonicalTarget = fs.realpathSync(path.dirname(resolvedTarget));
      } catch {
        canonicalTarget = resolvedTarget;
      }
    }

    const workspaceRoot = fs.realpathSync(process.cwd());

    const isAllowed = allowedDirs.some(allowedDir => {
      const resolvedAllowed = path.resolve(workspaceRoot, allowedDir);
      let canonicalAllowed: string;
      try {
        canonicalAllowed = fs.realpathSync(resolvedAllowed);
      } catch {
        canonicalAllowed = resolvedAllowed;
      }
      const relative = path.relative(canonicalAllowed, canonicalTarget);
      return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
    });

    if (!isAllowed) {
      console.log(Color.bold.red(`\n[SANDBOX-VIOLATION] Directory boundary escape attempt blocked!`));
      console.log(Color.red(`  Agent: ${agentId}`));
      console.log(Color.red(`  Path: ${targetPath}`));
      console.log(Color.red(`  Capability: ${capability}`));

      Hub.getInstance().reportIntel(
        'CRITICAL',
        `Sandboxed path check failed for agent ${agentId} on path: ${targetPath} (${capability})`,
        'PermissionProxy'
      );
      return false;
    }

    return this.requestCapability(agentId, capability, `Access path: ${targetPath}`);
  }

  public grantCapability(agentId: string, capability: PermissionCapability): void {
    const policy = this.policies.get(agentId) || { allowedCapabilities: [], autoApprove: false };
    if (!policy.allowedCapabilities.includes(capability)) {
      policy.allowedCapabilities.push(capability);
    }
    this.policies.set(agentId, policy);
  }
}
