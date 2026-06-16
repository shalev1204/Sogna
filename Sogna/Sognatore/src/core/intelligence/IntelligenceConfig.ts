import path from 'path';
import { pathToFileURL } from 'url';
import { Hub } from '../../Sentinel-Sognatore/Hub.js';

export interface IntelligenceRuntimeConfig {
  intelligence: Record<string, unknown>;
  localMode: boolean;
  keyless: boolean;
  allowCloud: boolean;
  defaultProvider: string;
}

type IntelligenceModule = {
  loadIntelligenceConfig: (sognaRoot: string) => IntelligenceRuntimeConfig;
  hasCloudApiKeys: () => boolean;
  verifyLocalProvider: (sognaRoot: string) => Promise<{ ok: boolean; message: string }>;
};

let mod: IntelligenceModule | null = null;

function sognaRootFromHub(): string {
  return path.resolve(Hub.getInstance().getSognatoreRoot(), '..');
}

async function loadModule(): Promise<IntelligenceModule> {
  if (mod) return mod;
  const libPath = path.join(sognaRootFromHub(), 'scripts', 'lib', 'intelligence-config.mjs');
  mod = (await import(pathToFileURL(libPath).href)) as IntelligenceModule;
  return mod;
}

export async function getIntelligenceRuntime(): Promise<IntelligenceRuntimeConfig> {
  const m = await loadModule();
  return m.loadIntelligenceConfig(sognaRootFromHub());
}

export async function assertTrustGate(): Promise<string> {
  const m = await loadModule();
  const root = sognaRootFromHub();
  const cfg = m.loadIntelligenceConfig(root);

  if (cfg.keyless || cfg.localMode) {
    const local = await m.verifyLocalProvider(root);
    if (local.ok) {
      return `Local/keyless OK — ${local.message}`;
    }
    if (cfg.allowCloud && m.hasCloudApiKeys()) {
      return `Local provider unavailable; cloud fallback allowed — ${local.message}`;
    }
    throw new Error(local.message);
  }

  if (!m.hasCloudApiKeys()) {
    throw new Error(
      'No valid AI provider keys found. Set SOGNATORE_KEYLESS=true and install Ollama, or add API keys.',
    );
  }

  return 'Cloud API keys present.';
}

export function isKeylessOrLocalSync(): boolean {
  return (
    process.env.SOGNATORE_KEYLESS === 'true' ||
    process.env.SOGNA_LOCAL_MODE === 'true'
  );
}
