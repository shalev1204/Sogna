import type { SwarmBase } from '../swarms/SwarmBase.js';
import type { swarmTask } from '../SwarmOrchestrator.js';

type DeptSwarmCtor = new () => SwarmBase;

const DEPT_ALIASES: Record<string, string> = {
  orchestration: 'operations',
  business: 'finance',
  security: 'protection',
  engineering: 'infrastructure',
  creative: 'studio',
  offensive: 'protection',
  monitor: 'operations',
  agents: 'crm',
  core: 'operations',
};

const DEPT_KEYS = [
  'crm', 'finance', 'growth', 'infrastructure', 'legal',
  'marketing', 'operations', 'protection', 'sales', 'studio',
] as const;

export class DeptSwarmRegistry {
  private static instances = new Map<string, SwarmBase>();

  private static async resolveCtor(key: string): Promise<DeptSwarmCtor | null> {
    switch (key) {
      case 'crm':
        return (await import('./crm/CRMSwarm.js')).CRMswarm;
      case 'finance':
        return (await import('./finance/FinanceSwarm.js')).Financeswarm;
      case 'growth':
        return (await import('./growth/GrowthSwarm.js')).Growthswarm;
      case 'infrastructure':
        return (await import('./infrastructure/InfrastructureSwarm.js')).Infrastructureswarm;
      case 'legal':
        return (await import('./legal/LegalSwarm.js')).Legalswarm;
      case 'marketing':
        return (await import('./marketing/MarketingSwarm.js')).Marketingswarm;
      case 'operations':
        return (await import('./operations/OperationsSwarm.js')).Operationsswarm;
      case 'protection':
        return (await import('./protection/ProtectionSwarm.js')).Protectionswarm;
      case 'sales':
        return (await import('./sales/SalesSwarm.js')).Salesswarm;
      case 'studio':
        return (await import('./studio/StudioSwarm.js')).Studioswarm;
      default:
        return null;
    }
  }

  static async get(deptKey: string): Promise<SwarmBase | null> {
    const key = deptKey.toLowerCase();
    if (!this.instances.has(key)) {
      const Ctor = await this.resolveCtor(key);
      if (!Ctor) return null;
      this.instances.set(key, new Ctor());
    }
    return this.instances.get(key) ?? null;
  }

  static mapSwarmLabel(label: string): string | null {
    const normalized = label.toLowerCase();
    if ((DEPT_KEYS as readonly string[]).includes(normalized)) return normalized;
    return DEPT_ALIASES[normalized] ?? null;
  }

  static resolveDepartments(task: swarmTask, semanticLabels: string[]): string[] {
    const resolved = new Set<string>();

    for (const label of semanticLabels) {
      const dept = this.mapSwarmLabel(label);
      if (dept) resolved.add(dept);
    }

    const haystack = `${task.type} ${task.description}`.toLowerCase();
    for (const dept of DEPT_KEYS) {
      if (haystack.includes(dept)) resolved.add(dept);
    }

    if (resolved.size === 0) resolved.add('operations');
    return Array.from(resolved);
  }

  static listDepartments(): string[] {
    return [...DEPT_KEYS];
  }
}
