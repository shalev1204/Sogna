import { Hub } from './hub.js';
import chalk from 'chalk';

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

    console.log(chalk.bold.red(`\n[SECURITY-ALERT] Intento de acceso no autorizado: ${capability}`));
    console.log(chalk.red(`  Agente: ${agentId}`));
    console.log(chalk.red(`  Contexto: ${context}`));

    Hub.getInstance().reportIntel('CRITICAL', `Denegada capacidad ${capability} para ${agentId}. Contexto: ${context}`, 'PermissionProxy');
    
    // For now, return false to enforce security unless explicitly allowed
    return false;
  }

  public grantCapability(agentId: string, capability: PermissionCapability): void {
    const policy = this.policies.get(agentId) || { allowedCapabilities: [], autoApprove: false };
    if (!policy.allowedCapabilities.includes(capability)) {
      policy.allowedCapabilities.push(capability);
    }
    this.policies.set(agentId, policy);
  }
}
