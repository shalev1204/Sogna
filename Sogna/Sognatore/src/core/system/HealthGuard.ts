import { MemoryHub } from '../memory/MemoryHub.js';
import { AssetHub } from '../storage/AssetHub.js';
import { Hub, SecurityState } from '../../Sentinel-Sognatore/Hub.js';
import { Engine } from '../../Sentinel-Sognatore/Engine.js';

export interface HealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  components: {
    memory: boolean;
    storage: boolean;
    security: boolean;
    engine: boolean;
  };
  details: string[];
  timestamp: string;
}

/**
 * HealthGuard - Unified stability diagnostic engine for Sogna.
 */
export class HealthGuard {
  private static instance: HealthGuard;

  public static getInstance(): HealthGuard {
    if (!HealthGuard.instance) HealthGuard.instance = new HealthGuard();
    return HealthGuard.instance;
  }

  public async performFullDiagnostic(): Promise<HealthStatus> {
    const details: string[] = [];
    const components = {
      memory: false,
      storage: false,
      security: false,
      engine: false
    };

    // 1. Check MemoryHub
    try {
      const mem = MemoryHub.getInstance();
      const graph = await mem.getsystemGraph();
      components.memory = graph.nodes.length > 0;
      if (!components.memory) details.push('MemoryHub: Graph is empty or inaccessible.');
    } catch (e: any) {
      details.push(`MemoryHub Error: ${e.message}`);
    }

    // 2. Check AssetHub
    try {
      const assets = AssetHub.getInstance();
      const manifest = assets.getManifest();
      components.storage = manifest !== null;
    } catch (e: any) {
      details.push(`AssetHub Error: ${e.message}`);
    }

    // 3. Check Security Hub
    try {
      const hub = Hub.getInstance();
      components.security = hub.getState() !== SecurityState.PANIC;
      if (!components.security) details.push('SecurityHub: System is in PANIC mode.');
    } catch (e: any) {
      details.push(`SecurityHub Error: ${e.message}`);
    }

    // 4. Check Sentinel Engine
    try {
      const engine = Engine.getInstance();
      components.engine = engine.hasPolicies();
      if (!components.engine) details.push('SentinelEngine: No policies loaded.');
    } catch (e: any) {
      details.push(`SentinelEngine Error: ${e.message}`);
    }

    const healthyCount = Object.values(components).filter(v => v).length;
    let status: HealthStatus['status'] = 'HEALTHY';
    if (healthyCount < 2) status = 'CRITICAL';
    else if (healthyCount < 4) status = 'DEGRADED';

    return {
      status,
      components,
      details,
      timestamp: new Date().toISOString()
    };
  }
}
