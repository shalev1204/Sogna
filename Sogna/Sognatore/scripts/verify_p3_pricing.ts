/**
 * verify_p3_pricing.ts — P3: tablas pricing unificadas (model_strategy.json SSOT).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateTokenCost,
  getPricingCatalogPath,
  resetPricingCatalog,
  validateTierModelCoverage,
} from '../src/core/pricing/ModelPricingCatalog.js';
import { CostTracker } from '../src/core/utils/CostTracker.js';
import { Treasurer } from '../src/Sentinel-Sognatore/Treasurer.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNATORE_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOGNA_ROOT = path.resolve(SOGNATORE_ROOT, '..');
const SRC = path.join(SOGNATORE_ROOT, 'src');
const STRATEGY_PATH = path.join(SOGNATORE_ROOT, 'resources/config/model_strategy.json');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function runStaticChecks(): Check[] {
  const checks: Check[] = [];
  const strategy = JSON.parse(read(STRATEGY_PATH)) as { pricing?: { models?: Record<string, unknown> } };
  const costTracker = read(path.join(SRC, 'core/utils/CostTracker.ts'));
  const treasurer = read(path.join(SRC, 'Sentinel-Sognatore/Treasurer.ts'));
  const catalog = read(path.join(SRC, 'core/pricing/ModelPricingCatalog.ts'));

  checks.push({
    name: 'model_strategy.json incluye pricing.models',
    ok: Boolean(strategy.pricing?.models && Object.keys(strategy.pricing.models).length >= 8),
    detail: `${Object.keys(strategy.pricing?.models ?? {}).length} modelos tarifados`,
  });
  checks.push({
    name: 'ModelPricingCatalog.ts existe y exporta calculateTokenCost',
    ok: /export function calculateTokenCost/.test(catalog),
    detail: 'SSOT de cálculo USD',
  });
  checks.push({
    name: 'CostTracker delega en ModelPricingCatalog',
    ok: /ModelPricingCatalog/.test(costTracker) && !/private pricing:/.test(costTracker),
    detail: 'Sin tabla hardcoded duplicada',
  });
  checks.push({
    name: 'Treasurer delega en ModelPricingCatalog',
    ok: /ModelPricingCatalog/.test(treasurer) && !/USD_RATES/.test(treasurer),
    detail: 'Sin USD_RATES duplicado',
  });

  resetPricingCatalog();
  const missing = validateTierModelCoverage(SOGNA_ROOT);
  checks.push({
    name: 'Todos los modelos de tiers tienen cobertura pricing',
    ok: missing.length === 0,
    detail: missing.length === 0 ? 'tiers ↔ pricing alineados' : `Faltan: ${missing.join(', ')}`,
  });

  return checks;
}

function runRuntimeCheck(): void {
  resetPricingCatalog();
  process.chdir(SOGNA_ROOT);

  const model = 'claude-3-5-sonnet-latest';
  const inputTokens = 10_000;
  const outputTokens = 2_000;

  const catalogCost = calculateTokenCost(model, inputTokens, outputTokens);
  const trackerCost = CostTracker.getInstance().calculateAndReport(
    model,
    inputTokens,
    outputTokens,
  );

  if (Math.abs(catalogCost - trackerCost) > 0.000001) {
    throw new Error(
      `CostTracker (${trackerCost}) ≠ catálogo (${catalogCost}) para ${model}`,
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sogna-p3-'));
  const treasurer = new Treasurer(tmpDir);
  treasurer.recordUsage('p3-verify', {
    agentId: 'p3-probe',
    model,
    tokens: inputTokens + outputTokens,
    inputTokens,
    outputTokens,
    durationMs: 100,
  });

  const report = treasurer.getProjectReport('p3-verify') as {
    entries: Array<{ costUsd?: number }>;
  } | null;

  const treasurerCost = report?.entries?.at(-1)?.costUsd ?? -1;
  if (Math.abs(treasurerCost - catalogCost) > 0.000001) {
    throw new Error(
      `Treasurer (${treasurerCost}) ≠ catálogo (${catalogCost}) para ${model}`,
    );
  }

  const catalogPath = getPricingCatalogPath();
  if (!catalogPath?.endsWith('model_strategy.json')) {
    throw new Error(`Ruta catálogo inesperada: ${catalogPath}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('OK  Runtime: CostTracker = Treasurer = catálogo SSOT');
  console.log(`     Fuente: ${catalogPath}`);
  console.log(`     Probe ${model}: $${catalogCost.toFixed(4)}`);
}

function main(): void {
  console.log('\n=== P3 PRICING UNIFICATION VERIFICATION ===\n');

  const checks = runStaticChecks();
  let failed = 0;
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}  ${c.name}`);
    console.log(`     ${c.detail}`);
    if (!c.ok) failed++;
  }
  console.log(`\nEstático: ${checks.length - failed}/${checks.length}`);

  if (failed > 0) {
    process.exit(1);
  }

  runRuntimeCheck();
  console.log('\nP3 pricing unificado verificado.\n');
}

main();
