/**
 * verify_p0_wiring.ts — Verificación RARV del cableado P0 Treasurer ↔ LLM paths.
 * Ejecutar: npx tsx Sognatore/scripts/verify_p0_wiring.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNA_ROOT = path.resolve(SCRIPT_DIR, '../..');
const SRC = path.join(SOGNA_ROOT, 'Sognatore/src');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function exists(p: string): boolean {
  return fs.existsSync(p);
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
  const checks: Check[] = [];

  const swarmBase = read(path.join(SRC, 'core/swarms/SwarmBase.ts'));
  checks.push({
    name: 'SwarmBase muta agent.think in-place',
    ok: /agent\.think\s*=/.test(swarmBase) && /DeptAgentRuntime\.think/.test(swarmBase),
    detail: 'addAgent() debe reemplazar think() en la instancia registrada',
  });

  const resilient = read(path.join(SRC, 'providers/ResilientProvider.ts'));
  checks.push({
    name: 'ResilientProvider gobierna presupuesto + tokens',
    ok: /assertBudgetAllowsUsage/.test(resilient) && /recordTokenUsage/.test(resilient),
    detail: 'Gate Treasurer y recordUsage en todo invoke',
  });

  const tokenRecording = read(path.join(SRC, 'core/utils/TokenRecording.ts'));
  checks.push({
    name: 'TokenRecording llama policies.recordUsage',
    ok: /policies\.recordUsage/.test(tokenRecording),
    detail: 'Puente único hacia Treasurer',
  });

  const agent = read(path.join(SRC, 'core/agents/Agent.ts'));
  checks.push({
    name: 'Agent pasa agentId/swarm al provider',
    ok: /agentId:\s*this\.id/.test(agent) && /swarm:\s*this\.role\.swarm/.test(agent),
    detail: 'Metadatos para OTEL/Treasurer en path core',
  });
  checks.push({
    name: 'Agent no duplica recordTokenUsage',
    ok: !/recordTokenUsage\s*\(/.test(agent),
    detail: 'Evita doble conteo — ResilientProvider registra',
  });

  const deptRuntime = read(path.join(SRC, 'core/dept/DeptAgentRuntime.ts'));
  checks.push({
    name: 'DeptAgentRuntime pasa agentId al provider',
    ok: /agentId:\s*profile\.id/.test(deptRuntime),
    detail: 'Dept swarms registran consumo por agente',
  });

  const orchestrator = read(path.join(SRC, 'core/SwarmOrchestrator.ts'));
  checks.push({
    name: 'SwarmOrchestrator ejecuta dept swarms reales',
    ok: /DeptSwarmRegistry/.test(orchestrator) && /swarm\.process\(/.test(orchestrator),
    detail: 'dispatchTask sin simulación sleep',
  });
  checks.push({
    name: 'SwarmOrchestrator sin handoff simulado',
    ok: !/setTimeout\(resolve,\s*500\)/.test(orchestrator),
    detail: 'No sleep 500ms fake',
  });

  const factory = read(path.join(SRC, 'core/ProviderFactory.ts'));
  checks.push({
    name: 'ProviderFactory envuelve con resiliencia',
    ok: /wrapWithResilience/.test(factory),
    detail: 'Retry transversal activo',
  });
  checks.push({
    name: 'Hybrid sin triple-wrap',
    ok: /new HybridProvider\(local, cloud\)/.test(factory) && !/wrapWithResilience\(new HybridProvider/.test(factory),
    detail: 'HybridProvider usa providers ya resilientes',
  });

  const deptSwarms = walkTs(path.join(SRC, 'core/dept')).filter((f) => f.endsWith('Swarm.ts'));
  const directThinkSwarms = deptSwarms.filter((f) => /this\.\w+\.think\(/.test(read(f)));
  checks.push({
    name: 'Dept swarms usan think() en instancias addAgent',
    ok: directThinkSwarms.length >= 8,
    detail: `${directThinkSwarms.length} swarms llaman this.*.think — OK si SwarmBase muta in-place`,
  });

  checks.push({
    name: 'getAvailableProviders envuelve con wrapWithResilience',
    ok: /wrapWithResilience\(raw\)/.test(factory),
    detail: 'AgentFactory y gates reciben providers gobernados',
  });
  checks.push({
    name: 'ResilientProvider preserva metadata.name',
    ok: !/name:\s*`resilient-/.test(resilient),
    detail: 'Agent.ts claude path y AgentFactory tier routing intactos',
  });

  checks.push({
    name: 'Resolución raíz institucional robusta',
    ok: exists(path.join(SRC, 'core/utils/InstitutionalRoot.ts')) &&
      /nested.*Sogna.*sognarc|SOGNA_ROOT/.test(read(path.join(SRC, 'core/utils/InstitutionalRoot.ts'))),
    detail: 'TokenRecording/policies encuentran .sognarc desde git root o Sognatore/',
  });

  checks.push({
    name: 'wrapWithResilience es idempotente',
    ok: /instanceof ResilientProvider/.test(resilient),
    detail: 'Evita doble conteo de tokens por wrap anidado',
  });

  const failed = checks.filter((c) => !c.ok);
  console.log('\n=== P0 WIRING VERIFICATION ===\n');
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}  ${c.name}`);
    console.log(`     ${c.detail}`);
  }
  console.log(`\nResultado: ${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) {
    console.error('\nFallos:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
  console.log('\nP0 cableado verificado.\n');
}

main();
