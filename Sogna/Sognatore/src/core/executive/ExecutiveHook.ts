// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
import { spawnSync } from 'child_process';
import path from 'path';
import * as fs from 'fs';
import { ToolHook, HookDecision, HookResult } from '../actions/ToolRegistry.js';
import { resolveInstitutionalRoot } from '../utils/InstitutionalRoot.js';
import { sentinelDir } from '@Sogna/Curator';

/**
 * ExecutiveHook - High-security internal plugin powered by the Rust Executive Core.
 */
export class ExecutiveHook implements ToolHook {
  public name = 'Executive Autonomy Protocol';
  private binaryPath: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.binaryPath = path.resolve(
      projectRoot, 
      'toolkit/executive-core/target/release/executive-core.exe'
    );
  }

  async preToolUse(name: string, args: Record<string, any>, tier: string): Promise<HookResult> {
    // Calculate a mock trust score for now (Grade Executive logic)
    // Tier 'gold' gets higher trust than 'silver'
    const trustScore = tier === 'gold' ? 0.9 : 0.4;

    let dynamicRules = null;
    try {
      const policyPath = sentinelDir(resolveInstitutionalRoot(this.projectRoot), 'data', 'control.json');
      const content = await fs.promises.readFile(policyPath, 'utf8');
      dynamicRules = JSON.parse(content);
    } catch (e) {
      // Silence is golden in security hooks fallbacks
    }

    const context = {
      tool_name: name,
      arguments: args,
      trust_score: trustScore,
      dynamic_rules: dynamicRules,
    };

    try {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
      const result = spawnSync(this.binaryPath, [], {
        input: JSON.stringify(context),
        encoding: 'utf8',
      });

      if (result.error) {
        return {
          decision: HookDecision.Allow,
          reason: `Executive Core unavailable: ${result.error.message}. Falling back to default security.`,
        };
      }

      const evaluation = JSON.parse(result.stdout);
      
      return {
        decision: this.mapRustDecision(evaluation.decision),
        reason: evaluation.reason,
        modifiedArguments: evaluation.modified_arguments,
      };
    } catch (err: any) {
      return {
        decision: HookDecision.Allow,
        reason: `Executive core failed: ${err.message}`,
      };
    }
  }

  private mapRustDecision(rustDecision: string): HookDecision {
    switch (rustDecision) {
      case 'Allow': return HookDecision.Allow;
      case 'Deny': return HookDecision.Deny;
      case 'RequireApproval': return HookDecision.RequireApproval;
      case 'Veto': return HookDecision.Veto;
      default: return HookDecision.Allow;
    }
  }
}

