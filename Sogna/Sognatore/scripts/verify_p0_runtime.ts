/**
 * verify_p0_runtime.ts — Smoke test runtime del cableado P0 (Treasurer + CostTracker).
 * Ejecutar: npx tsx Sognatore/scripts/verify_p0_runtime.ts
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Provider,
  type CapabilityTier,
  type InvokeOptions,
  type ProviderMetadata,
} from '../src/core/Provider.js';
import { wrapWithResilience, ResilientProvider } from '../src/providers/ResilientProvider.js';
import { CostTracker } from '../src/core/utils/CostTracker.js';
import { resetPolicyBinding } from '../src/core/utils/TokenRecording.js';
import { resolveInstitutionalRoot } from '../src/core/utils/InstitutionalRoot.js';
import * as policies from '../src/policies/index.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNA_ROOT = path.resolve(SCRIPT_DIR, '../..');

class MockProvider extends Provider {
  readonly metadata: ProviderMetadata = {
    name: 'gemini',
    displayName: 'Mock Gemini',
    cli: 'mock',
  };

  getName(): string {
    return 'gemini';
  }

  async detect(): Promise<boolean> {
    return true;
  }

  async version(): Promise<string> {
    return 'mock-1.0.0';
  }

  async invoke(_prompt: string, _options?: InvokeOptions): Promise<string> {
    return 'Mock institutional LLM response for P0 runtime verification.';
  }

  async invokeWithTier(
    _tier: CapabilityTier,
    prompt: string,
    options?: InvokeOptions,
  ): Promise<string> {
    return this.invoke(prompt, options);
  }
}

async function main(): Promise<void> {
  const gitRoot = path.resolve(SOGNA_ROOT, '..');
  process.chdir(gitRoot);
  policies.destroy();
  resetPolicyBinding();
  const institutionalRoot = resolveInstitutionalRoot(gitRoot);
  policies.init(institutionalRoot);

  const controller = policies.getCostController();
  const readProjectTokens = (): number => {
    if (!controller) return 0;
    const state = (controller as unknown as {
      _state: { projects: Record<string, { totalTokens: number }> };
    })._state;
    return state.projects?.sogna?.totalTokens ?? 0;
  };

  const tracker = CostTracker.getInstance();
  const sessionBefore = tracker.getSessionCost();
  const budgetBefore = policies.checkBudget('sogna');
  const tokensBefore = readProjectTokens();

  const wrapped = wrapWithResilience(new MockProvider());
  if (!(wrapped instanceof ResilientProvider)) {
    throw new Error('wrapWithResilience debe retornar ResilientProvider');
  }
  if (wrapped.metadata.name !== 'gemini') {
    throw new Error('ResilientProvider debe preservar metadata.name para AgentFactory');
  }

  const doubleWrapped = wrapWithResilience(wrapped);
  if (doubleWrapped !== wrapped) {
    throw new Error('wrapWithResilience debe ser idempotente (sin doble governance)');
  }

  await wrapped.invoke('P0 runtime verification prompt with sufficient length for token estimate.', {
    agentId: 'p0-runtime-verify',
    model: 'gemini-1.5-flash',
    swarm: 'verification',
  });

  const sessionAfter = tracker.getSessionCost();
  const budgetAfter = policies.checkBudget('sogna');
  const tokensAfter = readProjectTokens();
  controller?.flush();

  const treasurerActive = controller !== null && budgetBefore.remaining !== Infinity;
  const treasurerTracked = treasurerActive && tokensAfter > tokensBefore;

  const checks = [
    {
      name: 'Raíz institucional resuelta desde git root',
      ok: institutionalRoot.endsWith(`${path.sep}Sogna`) || institutionalRoot.includes('Sogna'),
    },
    {
      name: 'Treasurer instanciado con presupuesto .sognarc',
      ok: treasurerActive,
    },
    {
      name: 'CostTracker registró consumo',
      ok: sessionAfter > sessionBefore,
    },
    {
      name: 'Treasurer registró tokens',
      ok: treasurerTracked,
    },
    {
      name: 'Presupuesto no excedido en smoke test',
      ok: budgetAfter.exceeded !== true,
    },
  ];

  console.log('\n=== P0 RUNTIME VERIFICATION ===\n');
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}  ${c.name}`);
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    console.error('\nFallos runtime:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
  console.log('\nRuntime P0 verificado (MockProvider → ResilientProvider → Treasurer).\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
