import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveInstitutionalRoot } from '../utils/InstitutionalRoot.js';

export interface ModelPricingEntry {
  inputPer1M: number;
  outputPer1M: number;
  cacheCreationPer1M?: number;
  cacheReadPer1M?: number;
}

export interface PricingFuzzyRule {
  includes: string;
  model: string;
}

export interface PricingCatalogConfig {
  default_model: string;
  local_patterns: string[];
  models: Record<string, ModelPricingEntry>;
  fuzzy_rules?: PricingFuzzyRule[];
}

export interface PerTokenRates {
  input: number;
  output: number;
}

const ZERO_PRICING: ModelPricingEntry = {
  inputPer1M: 0,
  outputPer1M: 0,
  cacheCreationPer1M: 0,
  cacheReadPer1M: 0,
};

let _catalog: PricingCatalogConfig | null = null;
let _catalogPath: string | null = null;

export function resolveSognatoreRoot(startDir?: string): string {
  if (process.env.SOGNATORE_ROOT) {
    return process.env.SOGNATORE_ROOT;
  }

  const inst = resolveInstitutionalRoot(startDir);
  const candidates = [
    path.join(inst, 'Sognatore'),
    inst,
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'),
  ];

  for (const base of candidates) {
    const strategyPath = path.join(base, 'resources', 'config', 'model_strategy.json');
    if (fs.existsSync(strategyPath)) return base;
  }

  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}

function loadCatalogFromDisk(startDir?: string): PricingCatalogConfig {
  const root = resolveSognatoreRoot(startDir);
  const strategyPath = path.join(root, 'resources', 'config', 'model_strategy.json');
  _catalogPath = strategyPath;

  if (!fs.existsSync(strategyPath)) {
    throw new Error(`[ModelPricingCatalog] model_strategy.json no encontrado en ${strategyPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(strategyPath, 'utf8')) as { pricing?: PricingCatalogConfig };
  if (!raw.pricing?.models || !raw.pricing.default_model) {
    throw new Error('[ModelPricingCatalog] model_strategy.json sin sección pricing.models');
  }

  return raw.pricing;
}

export function getPricingCatalog(forceReload = false, startDir?: string): PricingCatalogConfig {
  if (_catalog && !forceReload) return _catalog;
  _catalog = loadCatalogFromDisk(startDir);
  return _catalog;
}

export function getPricingCatalogPath(): string | null {
  return _catalogPath;
}

export function resetPricingCatalog(): void {
  _catalog = null;
  _catalogPath = null;
}

export function isLocalModel(model: string, catalog = getPricingCatalog()): boolean {
  const modelLower = model.toLowerCase();
  return catalog.local_patterns.some((pattern) => modelLower.includes(pattern));
}

export function resolvePricingEntry(
  model: string,
  catalog = getPricingCatalog(),
): ModelPricingEntry {
  if (isLocalModel(model, catalog)) {
    return ZERO_PRICING;
  }

  const modelLower = model.toLowerCase();

  for (const [key, entry] of Object.entries(catalog.models)) {
    if (modelLower === key.toLowerCase() || modelLower.includes(key.toLowerCase())) {
      return entry;
    }
  }

  for (const rule of catalog.fuzzy_rules ?? []) {
    if (modelLower.includes(rule.includes.toLowerCase())) {
      const entry = catalog.models[rule.model];
      if (entry) return entry;
    }
  }

  const fallback = catalog.models[catalog.default_model];
  if (!fallback) {
    throw new Error(`[ModelPricingCatalog] default_model "${catalog.default_model}" no definido`);
  }
  return fallback;
}

export function getPerTokenRates(model: string, catalog = getPricingCatalog()): PerTokenRates {
  const pricing = resolvePricingEntry(model, catalog);
  return {
    input: pricing.inputPer1M / 1_000_000,
    output: pricing.outputPer1M / 1_000_000,
  };
}

export function calculateTokenCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWrite = 0,
  cacheRead = 0,
  catalog = getPricingCatalog(),
): number {
  const pricing = resolvePricingEntry(model, catalog);

  const standardCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  const cacheWriteCost =
    (cacheWrite / 1_000_000) * (pricing.cacheCreationPer1M ?? pricing.inputPer1M * 1.25);
  const cacheReadCost =
    (cacheRead / 1_000_000) * (pricing.cacheReadPer1M ?? pricing.inputPer1M * 0.1);

  return standardCost + outputCost + cacheWriteCost + cacheReadCost;
}

/** Verifica que todos los modelos referenciados en tiers tengan entrada pricing. */
export function validateTierModelCoverage(startDir?: string): string[] {
  const root = resolveSognatoreRoot(startDir);
  const strategyPath = path.join(root, 'resources', 'config', 'model_strategy.json');
  const raw = JSON.parse(fs.readFileSync(strategyPath, 'utf8')) as {
    tiers?: Record<string, { models?: Array<{ model: string }> }>;
    pricing?: PricingCatalogConfig;
  };

  const catalog = raw.pricing;
  if (!catalog?.models) return ['pricing.models ausente'];

  const missing: string[] = [];
  const seen = new Set<string>();

  for (const tier of Object.values(raw.tiers ?? {})) {
    for (const entry of tier.models ?? []) {
      if (seen.has(entry.model)) continue;
      seen.add(entry.model);
      if (isLocalModel(entry.model, catalog)) continue;
      if (!catalog.models[entry.model] && !matchesFuzzy(entry.model, catalog)) {
        missing.push(entry.model);
      }
    }
  }

  return missing;
}

function matchesFuzzy(model: string, catalog: PricingCatalogConfig): boolean {
  const modelLower = model.toLowerCase();
  for (const rule of catalog.fuzzy_rules ?? []) {
    if (modelLower.includes(rule.includes.toLowerCase()) && catalog.models[rule.model]) {
      return true;
    }
  }
  return false;
}
