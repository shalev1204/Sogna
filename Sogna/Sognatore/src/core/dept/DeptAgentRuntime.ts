import { ProviderFactory } from '../ProviderFactory.js';
import { Guardian } from '../Guardian.js';
import { ModelRouter } from '../ModelRouter.js';
import { deptAgentMap } from './deptAgentMap.js';

export interface DeptAgentProfile {
  id: string;
  role: string;
  specialty: string;
  department: string;
}

const DEPT_TIER: Record<string, 'fast' | 'development' | 'planning'> =
  deptAgentMap.dept_tiers;

/**
 * Runtime LLM unificado para agentes departamentales (dept/).
 * Incluye presupuesto Treasurer, registro de tokens y retry vía ResilientProvider.
 */
export class DeptAgentRuntime {
  static async think(profile: DeptAgentProfile, task: string): Promise<string> {
    const taskType = ModelRouter.detectTaskType(task);
    const routed = ModelRouter.getModelForTask(taskType);
    const provider = ProviderFactory.getProvider(routed.provider, routed.model);
    const tier = DEPT_TIER[profile.department] ?? DEPT_TIER.default;
    const model = routed.model || process.env.SOGNA_DEPT_MODEL || 'qwen2.5-coder:7b';

    const system = [
      `# SOGNA DEPT AGENT: ${profile.id}`,
      `Department: ${profile.department}`,
      `Role: ${profile.role}`,
      `Specialty: ${profile.specialty}`,
      'Respond concisely. If the task is operational, provide actionable output.',
    ].join('\n');

    const sanitized = Guardian.getInstance().sanitizePrompt(task);
    const prompt = `${system}\n\nTask:\n${sanitized}`;

    try {
      return await provider.invokeWithTier(tier, prompt, {
        model,
        tier,
        agentId: profile.id,
        swarm: profile.department,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[DeptAgentRuntime] Retry/failover path for ${profile.id}: ${message}`);
      return provider.invoke(prompt, {
        model,
        tier: 'fast',
        agentId: profile.id,
        swarm: profile.department,
      });
    }
  }
}
