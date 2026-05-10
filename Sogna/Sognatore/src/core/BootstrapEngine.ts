import { Color, FS as fs } from '@Sogna/Curator';

import { Guardian } from './Guardian.js';
import { AgentFactory } from './agents/AgentFactory.js';
import { ProviderFactory } from './ProviderFactory.js';
import { Hub } from '../Sentinel-Sognatore/Hub.js';
import { ToolResolver } from './ToolResolver.js';
import { BlueprintPredatore } from '@Sogna/Curator/shared/BlueprintPredatore.js';
import { getBlueprint } from '@Sogna/Curator/shared/BlueprintRegistry.js';

import path from 'path';
import { MemoryHub } from './memory/MemoryHub.js';

export enum BootstrapStage {
  DISCOVERY = 'DISCOVERY',
  HEALTH = 'HEALTH',
  TRUST = 'TRUST',
  SYNC = 'SYNC',
  READY = 'READY'
}

export interface StageStatus {
  stage: BootstrapStage;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  message?: string;
}

export class BootstrapEngine {
  private static instance: BootstrapEngine;
  private stages: Map<BootstrapStage, StageStatus> = new Map();

  private constructor() {
    Object.values(BootstrapStage).forEach(s => {
      this.stages.set(s, { stage: s, status: 'PENDING' });
    });
  }

  static getInstance(): BootstrapEngine {
    if (!BootstrapEngine.instance) {
      BootstrapEngine.instance = new BootstrapEngine();
    }
    return BootstrapEngine.instance;
  }

  async run(): Promise<boolean> {
    console.log(Color.bold.blue('\n--- SOGNATORE BOOTSTRAP GRAPH ---\n'));

    try {
      await this.runDiscovery();
      await this.runHealth();
      await this.runTrust();
      await this.runSync();
      await this.runReady();
      
      console.log(Color.bold.green('\n✓ Core Lifecycle Ready. Handoff to Cycle Loop.\n'));
      return true;
    } catch (error) {
      console.error(Color.bold.red(`\n✘ Bootstrap Failed at stage ${this.getActiveStage()}`));
      console.error(Color.red(`  Reason: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  private async runDiscovery() {
    this.updateStage(BootstrapStage.DISCOVERY, 'IN_PROGRESS', 'Scanning workspace and blueprints...');
    
    const predatore = new BlueprintPredatore();
    const blueprint = getBlueprint('Sognatore-core');
    
    if (blueprint) {
      const report = await predatore.audit(Hub.getInstance().getSognatoreRoot(), blueprint);
      if (report.integrityScore < 100) {
        console.log(predatore.renderReport(report));
        if (report.integrityScore < 50) {
          throw new Error('Critical architectural drift detected in Sognatore Core.');
        }
      }
    }

    this.updateStage(BootstrapStage.DISCOVERY, 'COMPLETED', `Found tech-stack: Node.js/TypeScript`);
  }

  private async runHealth() {
    this.updateStage(BootstrapStage.HEALTH, 'IN_PROGRESS', 'Performing Proactive Health Check (Safe Handshake)...');
    
    const { AutoHealer } = await import('@Sogna/Curator/shared/AutoHealer.js');
    const healer = AutoHealer.getInstance();
    
    const issues = await healer.performProactiveHealthCheck();
    
    if (issues.length > 0) {
      console.log(Color.yellow(`\n[HEALTH-GATE] Detected ${issues.length} environment issues needing attention.`));
      for (const scenario of issues) {
        const success = await healer.attemptRecovery(scenario, 'bootstrap');
        if (!success) {
          throw new Error(`Mandatory health check failed for ${scenario}. Please fix manually.`);
        }
      }
    }

    this.updateStage(BootstrapStage.HEALTH, 'COMPLETED', 'Environment verified and stable.');
  }

  private async runTrust() {
    this.updateStage(BootstrapStage.TRUST, 'IN_PROGRESS', 'Validating keys and guardian integrity...');
    
    const guardian = Guardian.getInstance();
    const rootHash = guardian.validateIntegrity();
    
    const hasKeys = process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!hasKeys) {
      throw new Error('No valid AI provider keys found in environment.');
    }

    this.updateStage(BootstrapStage.TRUST, 'COMPLETED', `Integrity Hash: ${rootHash.substring(0, 12)}...`);
  }

  private async runSync() {
    this.updateStage(BootstrapStage.SYNC, 'IN_PROGRESS', 'Parallel loading of providers and tools...');
    
    await Promise.all([
      ProviderFactory.getAvailableProviders(),
      AgentFactory.getInstance(),
      MemoryHub.getInstance().initialize().then(() => MemoryHub.getInstance().maintenance()),
      new ToolResolver(Hub.getInstance().getSognatoreRoot())
    ]);

    this.updateStage(BootstrapStage.SYNC, 'COMPLETED', 'Providers and swarm Catalog synchronized.');
  }

  private async runReady() {
    this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Finalizing handoff...');
    
    try {
      const { TelemetryServer } = await import('../observability/TelemetryServer.js');
      TelemetryServer.getInstance().start(8081);
      this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Telemetry Server Active on :8081');
    } catch (e: any) {
      console.log(Color.red(`[Telemetry] Could not start TelemetryServer: ${e.message}`));
    }

    this.updateStage(BootstrapStage.READY, 'COMPLETED', 'System at peak fidelity.');
  }

  private updateStage(stage: BootstrapStage, status: StageStatus['status'], message?: string) {
    this.stages.set(stage, { stage, status, message });
    
    const icon = status === 'COMPLETED' ? Color.green('✓') : (status === 'IN_PROGRESS' ? Color.yellow('➤') : Color.dim('○'));
    const label = Color.bold(stage.padEnd(12));
    const msg = message ? Color.dim(` - ${message}`) : '';
    
    console.log(`${icon} ${label}${msg}`);
  }

  private getActiveStage(): BootstrapStage {
    for (const [stage, status] of this.stages) {
      if (status.status === 'IN_PROGRESS') return stage;
    }
    return BootstrapStage.DISCOVERY;
  }
  
  getHistory(): StageStatus[] {
    return Array.from(this.stages.values());
  }
}
