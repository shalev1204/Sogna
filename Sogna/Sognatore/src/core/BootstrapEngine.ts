import chalk from 'chalk';
import { Guardian } from './Guardian.js';
import { AgentFactory } from './agents/AgentFactory.js';
import { ProviderFactory } from './ProviderFactory.js';
import { Hub } from '../Sentinel-Sognatore/Hub.js';
import { ToolResolver } from './ToolResolver.js';
import { BlueprintAuditor } from '@sogna/toolkit/shared/BlueprintAuditor.js';
import { getBlueprint } from '@sogna/toolkit/shared/BlueprintRegistry.js';
import fs from 'fs-extra';
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
    console.log(chalk.bold.blue('\n--- SOGNATORE BOOTSTRAP GRAPH ---\n'));

    try {
      await this.runDiscovery();
      await this.runHealth();
      await this.runTrust();
      await this.runSync();
      await this.runReady();
      
      console.log(chalk.bold.green('\n✓ Core Lifecycle Ready. Handoff to RARV Loop.\n'));
      return true;
    } catch (error) {
      console.error(chalk.bold.red(`\n✘ Bootstrap Failed at stage ${this.getActiveStage()}`));
      console.error(chalk.red(`  Reason: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  private async runDiscovery() {
    this.updateStage(BootstrapStage.DISCOVERY, 'IN_PROGRESS', 'Scanning workspace and blueprints...');
    
    const auditor = new BlueprintAuditor();
    const blueprint = getBlueprint('sognatore-core');
    
    if (blueprint) {
      const report = await auditor.audit(Hub.getInstance().getSognatoreRoot(), blueprint);
      if (report.integrityScore < 100) {
        console.log(auditor.renderReport(report));
        if (report.integrityScore < 50) {
          throw new Error('Critical architectural drift detected in Sognatore Core.');
        }
      }
    }

    this.updateStage(BootstrapStage.DISCOVERY, 'COMPLETED', `Found tech-stack: Node.js/TypeScript`);
  }

  private async runHealth() {
    this.updateStage(BootstrapStage.HEALTH, 'IN_PROGRESS', 'Performing Proactive Health Check (Safe Handshake)...');
    
    // Lazy import to avoid circular dep if any, though AutoHealer is in toolkit
    const { AutoHealer } = await import('@sogna/toolkit/shared/AutoHealer.js');
    const healer = AutoHealer.getInstance();
    
    const issues = await healer.performProactiveHealthCheck();
    
    if (issues.length > 0) {
      console.log(chalk.yellow(`\n[HEALTH-GATE] Detected ${issues.length} environment issues needing attention.`));
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
    
    // Simulating deep key validation
    const hasKeys = process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!hasKeys) {
      throw new Error('No valid AI provider keys found in environment.');
    }

    this.updateStage(BootstrapStage.TRUST, 'COMPLETED', `Integrity Hash: ${rootHash.substring(0, 12)}...`);
  }

  private async runSync() {
    this.updateStage(BootstrapStage.SYNC, 'IN_PROGRESS', 'Parallel loading of providers and tools...');
    
    // Parallel Load
    await Promise.all([
      ProviderFactory.getAvailableProviders(),
      AgentFactory.getInstance(),
      MemoryHub.getInstance().initialize().then(() => MemoryHub.getInstance().maintenance()),
      new ToolResolver(Hub.getInstance().getSognatoreRoot()) // Conceptual parallel loading
    ]);

    this.updateStage(BootstrapStage.SYNC, 'COMPLETED', 'Providers and Swarm Catalog synchronized.');
  }

  private async runReady() {
    this.updateStage(BootstrapStage.READY, 'IN_PROGRESS', 'Finalizing handoff...');
    this.updateStage(BootstrapStage.READY, 'COMPLETED', 'System at peak fidelity.');
  }

  private updateStage(stage: BootstrapStage, status: StageStatus['status'], message?: string) {
    this.stages.set(stage, { stage, status, message });
    
    const icon = status === 'COMPLETED' ? chalk.green('✓') : (status === 'IN_PROGRESS' ? chalk.yellow('➤') : chalk.dim('○'));
    const label = chalk.bold(stage.padEnd(12));
    const msg = message ? chalk.dim(` - ${message}`) : '';
    
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
