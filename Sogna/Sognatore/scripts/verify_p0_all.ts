/**
 * verify_p0_all.ts — Batería completa P0 (estática + runtime + auditoría).
 * Ejecutar: npx tsx Sognatore/scripts/verify_p0_all.ts
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNATORE_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOGNA_ROOT = path.resolve(SOGNATORE_ROOT, '..');
const GIT_ROOT = path.resolve(SOGNA_ROOT, '..');
const SRC = path.join(SOGNATORE_ROOT, 'src');

function runStep(label: string, command: string, cwd: string): void {
  console.log(`\n--- ${label} (cwd: ${cwd}) ---`);
  const result = spawnSync(command, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${label} falló (exit ${result.status ?? 'unknown'})`);
  }
}

function scanUngovernedInvokeSites(): string[] {
  const allowedWithoutAgentId = new Set([
    path.join(SRC, 'providers'),
    path.join(SRC, 'core', 'Provider.ts'),
  ]);
  const invokeFiles = [
    'core/Runner.ts',
    'core/Orchestrator.ts',
    'core/GitManager.ts',
    'core/agents/Agent.ts',
    'core/dept/DeptAgentRuntime.ts',
    'core/gates/BlindReviewGate.ts',
    'core/gates/AntiSycophancyGate.ts',
  ];
  const failures: string[] = [];
  for (const rel of invokeFiles) {
    const full = path.join(SOGNATORE_ROOT, 'src', rel.replace(/\//g, path.sep));
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (!/\.invoke\(|invokeWithTier\(/.test(text)) continue;
    if (!/agentId:/.test(text)) {
      failures.push(`${rel} invoca LLM sin agentId`);
    }
  }
  return failures;
}

function scanRawProviderConstructorsOutsideFactory(): string[] {
  const factoryPath = path.join(SRC, 'core', 'ProviderFactory.ts');
  const failures: string[] = [];
  const pattern = /new (Gemini|Claude|OpenAI|Ollama|Hybrid|Moonshot|DeepSeek|OpenRouter|Aider)Provider\s*\(/;
  for (const file of walkTs(SRC)) {
    if (file === factoryPath) continue;
    if (file.includes(`${path.sep}providers${path.sep}`)) continue;
    if (pattern.test(fs.readFileSync(file, 'utf8'))) {
      failures.push(path.relative(SOGNA_ROOT, file));
    }
  }
  return failures;
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) out.push(...walkTs(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

function main(): void {
  console.log('\n========== SOGNA P0 FULL VERIFICATION ==========\n');

  runStep('tsc --noEmit', 'pnpm check', SOGNATORE_ROOT);
  runStep('verify_p0_wiring', 'npx tsx scripts/verify_p0_wiring.ts', SOGNATORE_ROOT);
  runStep('verify_p0_runtime', 'npx tsx scripts/verify_p0_runtime.ts', SOGNATORE_ROOT);
  runStep('dept_swarm_strategy_audit', 'npx tsx scripts/dept_swarm_strategy_audit.ts', SOGNATORE_ROOT);

  const ungoverned = scanUngovernedInvokeSites();
  if (ungoverned.length > 0) {
    throw new Error(`Invoke sin agentId:\n  - ${ungoverned.join('\n  - ')}`);
  }
  console.log('\nOK  Todos los call-sites LLM de producción incluyen agentId');

  const rawProviders = scanRawProviderConstructorsOutsideFactory();
  if (rawProviders.length > 0) {
    throw new Error(`Providers raw fuera de ProviderFactory:\n  - ${rawProviders.join('\n  - ')}`);
  }
  console.log('OK  Sin constructores de Provider raw fuera de ProviderFactory');

  const policiesText = fs.readFileSync(path.join(SRC, 'policies', 'index.ts'), 'utf8');
  if (!/_treasurer = new Treasurer/.test(policiesText)) {
    throw new Error('policies.init no instancia Treasurer incondicionalmente');
  }
  console.log('OK  Treasurer siempre instanciado en policies.init');

  console.log('\n========== P0 100% VERIFICADO ==========\n');
}

main();
