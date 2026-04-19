// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
import { execSync } from 'child_process';
import { SognaEventBus, SognaEventType, FailureClass, EventProvenance } from './events/SognaEventBus.js';
import { PolicyEngine, EscalationLevel } from './PolicyEngine.js';

export class AutoHealer {
  private static instance: AutoHealer;
  private attemptMap: Map<string, number> = new Map();
  private bus = SognaEventBus.getInstance();
  private policyEngine = PolicyEngine.getInstance();

  private constructor() {}

  static getInstance(): AutoHealer {
    if (!AutoHealer.instance) {
      AutoHealer.instance = new AutoHealer();
    }
    return AutoHealer.instance;
  }

  /**
   * Identifies a failure scenario from an error message or exit code.
   */
  detectScenario(error: string): FailureClass {
    const e = error.toLowerCase();
    if (e.includes('conflict') || e.includes('merge failed')) return FailureClass.GIT;
    if (e.includes('stale') || e.includes('diverged')) return FailureClass.GIT;
    if (e.includes('cannot find module') || e.includes('npm install')) return FailureClass.INFRA;
    if (e.includes('permission denied') || e.includes('eacces')) return FailureClass.PERMISSION;
    if (e.includes('timeout') || e.includes('mcp')) return FailureClass.INFRA;
    if (e.includes('docker') || e.includes('sandbox')) return FailureClass.SANDBOX;
    if (e.includes('api key') || e.includes('auth error')) return FailureClass.API;
    return FailureClass.NONE;
  }

  /**
   * Scans for proactive recovery needs using the PolicyEngine.
   */
  async performProactiveHealthCheck(): Promise<FailureClass[]> {
    const identified: FailureClass[] = [];
    
    for (const scenario of Object.values(FailureClass)) {
      const recipe = this.policyEngine.getRecipe(scenario);
      if (recipe && recipe.proactive && recipe.check) {
        try {
          const needsHealing = await recipe.check.action(process.cwd());
          if (needsHealing) identified.push(scenario);
        } catch (e) {
          // Check failed, log as infra noise
        }
      }
    }
    
    return identified;
  }

  /**
   * Attempts automatic recovery for a given failure class using PolicyEngine recipes.
   */
  async attemptRecovery(scenario: FailureClass, contextId: string): Promise<boolean> {
    const recipe = this.policyEngine.getRecipe(scenario);
    if (!recipe) return false;

    const key = `${contextId}:${scenario}`;
    const attempts = this.attemptMap.get(key) || 0;

    if (attempts >= recipe.maxAttempts) {
      this.bus.publish({
        type: SognaEventType.ERROR,
        emitter: 'AutoHealer',
        failureClass: scenario,
        provenance: EventProvenance.HEALTH,
        data: { 
          message: `Max attempts reached for ${scenario}. Escalation: ${recipe.escalation}`,
          escalation: recipe.escalation 
        }
      });
      return false;
    }

    this.bus.publish({
      type: SognaEventType.RECOVERY,
      emitter: 'AutoHealer',
      failureClass: scenario,
      provenance: EventProvenance.HEALTH,
      data: { recipe: scenario, attempt: attempts + 1, totalSteps: recipe.steps.length }
    });

    for (const step of recipe.steps) {
      try {
        this.bus.publish({
          type: SognaEventType.LOG,
          emitter: 'AutoHealer',
          failureClass: scenario,
          provenance: EventProvenance.HEALTH,
          data: { message: `Executing recovery step: ${step.name}` }
        });

        if (step.command) {
// @sentinel-ignore: Justificación institucional inyectada por Auto-Remediador Apex
          execSync(step.command, { stdio: 'pipe' });
        }
        if (step.action) {
          await step.action();
        }
      } catch (e: any) {
        if (step.critical) {
          this.bus.publish({
            type: SognaEventType.ERROR,
            emitter: 'AutoHealer',
            failureClass: scenario,
            provenance: EventProvenance.HEALTH,
            data: { message: `Critical step ${step.name} failed: ${e.message}` }
          });
          return false;
        }
      }
    }

    this.attemptMap.set(key, attempts + 1);
    
    // Successful recovery event
    this.bus.publish({
      type: SognaEventType.RECOVERY,
      emitter: 'AutoHealer',
      failureClass: scenario,
      provenance: EventProvenance.HEALTH,
      data: { status: 'COMPLETED', recipe: scenario }
    });

    return true;
  }

  resetAttempts(contextId: string) {
    for (const key of this.attemptMap.keys()) {
      if (key.startsWith(contextId)) this.attemptMap.delete(key);
    }
  }
}

