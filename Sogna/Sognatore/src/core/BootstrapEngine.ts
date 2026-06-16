import { Color, FS as fs } from '@Sogna/Curator';

import { Guardian } from './Guardian.js';
import { AgentFactory } from './agents/AgentFactory.js';
import { ProviderFactory } from './ProviderFactory.js';
import { Hub } from '../Sentinel-Sognatore/Hub.js';
import { ToolResolver } from './ToolResolver.js';
import { BlueprintPredatore } from '@Sogna/Curator/shared/BlueprintPredatore.js';
import { getBlueprint } from '@Sogna/Curator/shared/BlueprintRegistry.js';

import path from 'path';
import fsNode from 'fs';
import { MemoryHub } from './memory/MemoryHub.js';
import { MemoryConsolidator } from './memory-consolidator.js';
import { assertTrustGate } from './intelligence/IntelligenceConfig.js';

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
  private static identityDirective: string = '';
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

  public static getIdentityDirective(): string {
    return this.identityDirective;
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
    
    // Verify cryptographic forensic Security Audit chain
    const { SecurityAudit } = await import('../Sentinel-Sognatore/SecurityAudit.js');
    const securityAudit = SecurityAudit.getInstance(Hub.getInstance().getSognatoreRoot());
    if (!securityAudit.verifyChain()) {
      throw new Error('Security Breach: The forensic Security Audit log has been tampered with or corrupted!');
    }

    // Verify cryptographic forensic Operations Audit chain
    const { AuditLog } = await import('../audit/AuditLog.js');
    const auditLog = new AuditLog({ projectDir: Hub.getInstance().getSognatoreRoot() });
    const auditVerification = auditLog.verifyChain();
    if (!auditVerification.valid) {
      throw new Error(`Security Breach: The forensic Operations Audit log has been tampered with! Details: ${auditVerification.error}`);
    }
    
    const trustMessage = await assertTrustGate();

    this.updateStage(BootstrapStage.TRUST, 'COMPLETED', `Integrity Verified. ${trustMessage} Hash: ${rootHash.substring(0, 12)}...`);
  }

  private async runSync() {
    this.updateStage(BootstrapStage.SYNC, 'IN_PROGRESS', 'Parallel loading of providers, tools, and identity directive...');
    
    // Cargar sogna.md (Fuente Unica de Verdad - SSOT)
    const identityPath = path.join(Hub.getInstance().getSognatoreRoot(), '..', 'memory', 'identity', 'sogna.md');
    try {
      if (fsNode.existsSync(identityPath)) {
        BootstrapEngine.identityDirective = fsNode.readFileSync(identityPath, 'utf-8');
        console.log(Color.green(`[IDENTITY-LOAD] Fuente Única de Verdad (sogna.md) cargada satisfactoriamente.`));
      } else {
        console.log(Color.yellow(`[IDENTITY-LOAD] Advertencia: Archivo de identidad no encontrado en: ${identityPath}`));
      }
    } catch (e: any) {
      console.log(Color.red(`[IDENTITY-LOAD] Error al cargar la directiva de identidad: ${e.message}`));
    }

    await Promise.all([
      ProviderFactory.getAvailableProviders(),
      AgentFactory.getInstance(),
      MemoryHub.getInstance().initialize().then(() => MemoryHub.getInstance().maintenance()),
      new ToolResolver(Hub.getInstance().getSognatoreRoot())
    ]);

    this.updateStage(BootstrapStage.SYNC, 'COMPLETED', 'Providers, swarm Catalog, and Identity synchronized.');
  }

  private async runReady() {
    this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Finalizing handoff (Activating Swarm)...');
    
    try {
      const { HandshakeProtocol } = await import('./brain/HandshakeProtocol.js');
      await HandshakeProtocol.getInstance().executeFullHandshake();
    } catch (e: any) {
      console.log(Color.red(`[NHP] Handshake Protocol failed: ${e.message}`));
    }

    try {
      const { ensureObservability } = await import('../observability/bootstrap.js');
      ensureObservability();
      const { TelemetryServer } = await import('../observability/TelemetryServer.js');
      TelemetryServer.getInstance().start(8081);
      this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Telemetry Server Active on :8081');
    } catch (e: any) {
      console.log(Color.red(`[Telemetry] Could not start TelemetryServer: ${e.message}`));
    }

    // Activar daemon de consolidacion sinaptica en segundo plano
    try {
      const consolidator = MemoryConsolidator.getInstance();
      consolidator.start();
      this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Synaptic Consolidator Daemon Active (idle-triggered).');
    } catch (e: any) {
      console.log(Color.yellow(`[CONSOLIDATOR] Could not start synaptic daemon: ${e.message}`));
    }

    this.updateStage(BootstrapStage.READY, 'COMPLETED', 'System at peak fidelity. Swarm Active.');
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
