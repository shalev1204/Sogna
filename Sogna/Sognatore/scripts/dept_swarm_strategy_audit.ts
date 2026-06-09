/**
 * dept_swarm_strategy_audit.ts
 * Auditoría estática: departamentos dept/, consumo de tokens, coste y resiliencia API.
 * Ejecutar desde Sogna/: npx tsx Sognatore/scripts/dept_swarm_strategy_audit.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNA_ROOT = path.resolve(SCRIPT_DIR, '../..');
const DEPT_ROOT = path.join(SOGNA_ROOT, 'Sognatore/src/core/dept');
const CORE_ROOT = path.join(SOGNA_ROOT, 'Sognatore/src/core');
const OUT_DIR = path.join(SOGNA_ROOT, 'memory/operational/audits');

interface DeptAudit {
  department: string;
  swarmFile: string;
  agentCount: number;
  agents: string[];
  kpiTracker: string | null;
  skillRegistry: boolean;
  strategyMap: boolean;
  llmIntegration: 'none' | 'stub' | 'runtime';
  apiRetryInDept: boolean;
  tokenTrackingInDept: boolean;
  notes: string[];
}

interface GlobalFindings {
  timestamp: string;
  departments: DeptAudit[];
  runtime: {
    agentRecordStats: boolean;
    costTrackerPath: string;
    treasurerRecordUsageCallers: number;
    policiesRecordUsageDefined: boolean;
    hybridFailover30s: boolean;
    geminiQuotaFallback: boolean;
    swarmOrchestratorSimulated: boolean;
    modelStrategyTiers: string[];
    budgetMaxTokens: number | null;
    tokenRecordingModule: boolean;
    budgetGateInAgent: boolean;
    deptAgentRuntime: boolean;
    swarmBaseLlmWrap: boolean;
    swarmBaseInPlaceWrap: boolean;
    resilientProviderGovernance: boolean;
    availableProvidersWrapped: boolean;
    deptSwarmRegistry: boolean;
    deptCostTierRouting: boolean;
  };
  score: {
    tokenGovernance: number;
    costOptimization: number;
    apiResilience: number;
    deptIntegration: number;
  };
  criticalGaps: string[];
}

function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

function readText(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

const EXCLUDED_DEPT_DIRS = new Set(['metrics']);

function listDeptDirs(): string[] {
  return fs.readdirSync(DEPT_ROOT).filter((d) => {
    const full = path.join(DEPT_ROOT, d);
    return fs.statSync(full).isDirectory() && !EXCLUDED_DEPT_DIRS.has(d);
  });
}

function auditDepartment(dept: string): DeptAudit {
  const deptPath = path.join(DEPT_ROOT, dept);
  const swarmCandidates = fs.readdirSync(deptPath).filter((f) => f.endsWith('Swarm.ts'));
  const swarmFile = swarmCandidates[0] ?? '';
  const swarmPath = swarmFile ? path.join(deptPath, swarmFile) : '';
  const swarmContent = swarmPath && fileExists(swarmPath) ? readText(swarmPath) : '';

  const agentsDir = path.join(deptPath, 'agents');
  const agents = fileExists(agentsDir)
    ? fs.readdirSync(agentsDir).filter((f) => f.endsWith('.ts')).map((f) => f.replace('.ts', ''))
    : [];

  const metricsDir = path.join(deptPath, 'metrics');
  let kpiTracker: string | null = null;
  if (fileExists(metricsDir)) {
    const kpis = fs.readdirSync(metricsDir).filter((f) => f.includes('KPI') || f.includes('Monitor'));
    kpiTracker = kpis[0] ?? null;
  }

  const skillsDir = path.join(deptPath, 'skills');
  const knowledgeDir = path.join(deptPath, 'knowledge');
  const skillRegistry = fileExists(skillsDir) && fs.readdirSync(skillsDir).some((f) => f.includes('SkillRegistry'));
  const strategyMap = fileExists(knowledgeDir) && fs.readdirSync(knowledgeDir).some((f) => f.endsWith('_STRATEGY_MAP.md'));

  const agentSources = agents.map((a) => path.join(agentsDir, `${a}.ts`)).filter(fileExists);
  const swarmBasePath = path.join(CORE_ROOT, 'swarms/SwarmBase.ts');
  const runtimePath = path.join(DEPT_ROOT, 'DeptAgentRuntime.ts');
  const swarmBaseContent = fileExists(swarmBasePath) ? readText(swarmBasePath) : '';
  const swarmBaseUsesRuntime = /DeptAgentRuntime/.test(swarmBaseContent);
  const swarmBaseInPlaceWrap = /agent\.think\s*=/.test(swarmBaseContent);

  let llmIntegration: 'none' | 'stub' | 'runtime' = 'stub';
  if (agentSources.length === 0) {
    llmIntegration = 'none';
  } else if (swarmBaseUsesRuntime && swarmBaseInPlaceWrap) {
    llmIntegration = 'runtime';
  }
  const deptTree = walkTsFiles(deptPath).map(readText).join('\n');
  const sharedRuntime = fileExists(runtimePath) ? readText(runtimePath) : '';
  const apiRetryInDept =
    /retry|backoff|failover|429/i.test(deptTree) ||
    /retry|backoff|failover/i.test(sharedRuntime);
  const tokenTrackingInDept =
    /recordTokenUsage|recordUsage|Treasurer|token/i.test(deptTree) ||
    /recordTokenUsage|recordUsage/i.test(sharedRuntime);

  const notes: string[] = [];
  if (!swarmFile) notes.push('Sin *Swarm.ts');
  if (agents.length === 0) notes.push('Sin agentes en agents/');
  if (kpiTracker && !/DeptKPISnapshot|getTokenGovernanceSnapshot|persistDeptKPI/.test(readText(path.join(metricsDir, kpiTracker)))) {
    notes.push('KPI tracker sin enlace Treasurer/CostTracker (P2)');
  }
  if (/simulate|mock|hardcode|console\.log/i.test(swarmContent)) {
    notes.push('Swarm con lógica simulada o logging');
  }

  return {
    department: dept,
    swarmFile,
    agentCount: agents.length,
    agents,
    kpiTracker,
    skillRegistry,
    strategyMap,
    llmIntegration,
    apiRetryInDept,
    tokenTrackingInDept,
    notes,
  };
}

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walkTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

function countRecordUsageCallers(): number {
  const sognatoreSrc = path.join(SOGNA_ROOT, 'Sognatore/src');
  let count = 0;
  for (const file of walkTsFiles(sognatoreSrc)) {
    const normalized = file.replace(/\\/g, '/');
    if (normalized.endsWith('policies/index.ts') || normalized.endsWith('Sentinel-Sognatore/Treasurer.ts')) {
      continue;
    }
    const text = readText(file);
    if (/recordUsage\s*\(/.test(text)) count++;
  }
  return count;
}

function loadBudgetMaxTokens(): number | null {
  const rcPath = path.join(SOGNA_ROOT, '.sognarc.json');
  if (!fileExists(rcPath)) return null;
  try {
    const rc = JSON.parse(readText(rcPath)) as {
      budget_limits?: { max_tokens?: number };
      resource_quotas?: { budget_limits?: { max_tokens?: number } };
    };
    return rc.resource_quotas?.budget_limits?.max_tokens ?? rc.budget_limits?.max_tokens ?? null;
  } catch {
    return null;
  }
}

function loadModelTiers(): string[] {
  const p = path.join(SOGNA_ROOT, 'Sognatore/resources/config/model_strategy.json');
  if (!fileExists(p)) return [];
  try {
    const j = JSON.parse(readText(p)) as { tiers?: Record<string, unknown> };
    return Object.keys(j.tiers ?? {});
  } catch {
    return [];
  }
}

function computeScores(depts: DeptAudit[], runtime: GlobalFindings['runtime']): GlobalFindings['score'] {
  const deptCount = Math.max(depts.length, 1);
  const runtimeAgents = depts.filter((d) => d.llmIntegration === 'runtime').length;

  let tokenGovernance = 0;
  if (runtime.resilientProviderGovernance) tokenGovernance += 35;
  if (runtime.treasurerRecordUsageCallers > 0) tokenGovernance += 25;
  if (runtime.tokenRecordingModule) tokenGovernance += 20;
  if (runtime.budgetMaxTokens) tokenGovernance += 20;

  let costOptimization = 0;
  if (runtime.modelStrategyTiers.length >= 3) costOptimization += 25;
  if (runtime.hybridFailover30s) costOptimization += 20;
  if (runtime.deptCostTierRouting) costOptimization += 25;
  if (runtime.deptSwarmRegistry) costOptimization += 15;
  if (!runtime.swarmOrchestratorSimulated) costOptimization += 15;

  let apiResilience = 0;
  if (runtime.hybridFailover30s) apiResilience += 25;
  if (runtime.geminiQuotaFallback) apiResilience += 20;
  if (runtime.resilientProviderGovernance) apiResilience += 30;
  if (!runtime.swarmOrchestratorSimulated) apiResilience += 25;

  const deptIntegration = Math.round(
    (runtimeAgents / deptCount) * 35 +
      (depts.filter((d) => d.agentCount > 0 && d.swarmFile).length / deptCount) * 25 +
      (runtime.deptSwarmRegistry ? 20 : 0) +
      (runtime.swarmBaseInPlaceWrap ? 20 : 0),
  );

  return {
    tokenGovernance: Math.min(100, tokenGovernance),
    costOptimization: Math.min(100, costOptimization),
    apiResilience: Math.min(100, apiResilience),
    deptIntegration: Math.min(100, deptIntegration),
  };
}

function buildCriticalGaps(depts: DeptAudit[], runtime: GlobalFindings['runtime']): string[] {
  const gaps: string[] = [];
  if (runtime.treasurerRecordUsageCallers === 0) {
    gaps.push('CRITICO: policies.recordUsage() no invocado desde Agent/CostTracker — presupuesto inoperante');
  }
  if (!runtime.availableProvidersWrapped) {
    gaps.push('CRITICO: getAvailableProviders() devuelve providers sin gobierno — AgentFactory bypass');
  }
  if (runtime.swarmOrchestratorSimulated) {
    gaps.push('ALTO: SwarmOrchestrator.dispatchTask() simula handoff (sleep 500ms), no ejecuta dept swarms');
  }
  if (!runtime.swarmBaseInPlaceWrap) {
    gaps.push('CRITICO: SwarmBase.addAgent() no muta agent.think — execute() dept sigue en stubs');
  }
  if (!runtime.resilientProviderGovernance) {
    gaps.push('CRITICO: ResilientProvider sin assertBudget + recordTokenUsage transversal');
  }
  if (!runtime.deptAgentRuntime || !runtime.swarmBaseLlmWrap) {
    gaps.push('ALTO: DeptAgentRuntime no cableado en SwarmBase.addAgent()');
  }
  if (!runtime.tokenRecordingModule) {
    gaps.push('CRITICO: TokenRecording no presente en el path LLM');
  }
  if (depts.some((d) => d.llmIntegration === 'stub')) {
    gaps.push('MEDIO: Algunos departamentos sin runtime LLM verificado');
  }
  return gaps;
}

function main(): void {
  const departments = listDeptDirs().sort().map(auditDepartment);

  const agentPath = path.join(CORE_ROOT, 'agents/Agent.ts');
  const agentCode = fileExists(agentPath) ? readText(agentPath) : '';
  const hybridPath = path.join(SOGNA_ROOT, 'Sognatore/src/providers/HybridProvider.ts');
  const geminiPath = path.join(SOGNA_ROOT, 'Sognatore/src/providers/GeminiProvider.ts');
  const swarmOrchPath = path.join(CORE_ROOT, 'SwarmOrchestrator.ts');

  const tokenRecordingPath = path.join(CORE_ROOT, 'utils/TokenRecording.ts');
  const deptRuntimePath = path.join(DEPT_ROOT, 'DeptAgentRuntime.ts');
  const registryPath = path.join(DEPT_ROOT, 'DeptSwarmRegistry.ts');
  const swarmBasePath = path.join(CORE_ROOT, 'swarms/SwarmBase.ts');
  const resilientPath = path.join(SOGNA_ROOT, 'Sognatore/src/providers/ResilientProvider.ts');
  const providerFactoryPath = path.join(CORE_ROOT, 'ProviderFactory.ts');
  const swarmBaseContent = fileExists(swarmBasePath) ? readText(swarmBasePath) : '';
  const resilientContent = fileExists(resilientPath) ? readText(resilientPath) : '';

  const runtime = {
    agentRecordStats: /recordStats/.test(agentCode),
    costTrackerPath: 'Sognatore/src/core/utils/CostTracker.ts',
    treasurerRecordUsageCallers: countRecordUsageCallers(),
    policiesRecordUsageDefined: fileExists(path.join(SOGNA_ROOT, 'Sognatore/src/policies/index.ts')),
    hybridFailover30s: fileExists(hybridPath) && /30000|30s/.test(readText(hybridPath)),
    geminiQuotaFallback: fileExists(geminiPath) && /429|Quota/.test(readText(geminiPath)),
    swarmOrchestratorSimulated:
      fileExists(swarmOrchPath) &&
      /setTimeout\(resolve,\s*500\)/.test(readText(swarmOrchPath)) &&
      !/DeptSwarmRegistry/.test(readText(swarmOrchPath)),
    modelStrategyTiers: loadModelTiers(),
    budgetMaxTokens: loadBudgetMaxTokens(),
    tokenRecordingModule: fileExists(tokenRecordingPath),
    budgetGateInAgent: /agentId:\s*this\.id/.test(agentCode),
    deptAgentRuntime: fileExists(deptRuntimePath),
    swarmBaseLlmWrap: /DeptAgentRuntime/.test(swarmBaseContent),
    swarmBaseInPlaceWrap: /agent\.think\s*=/.test(swarmBaseContent),
    deptSwarmRegistry: fileExists(registryPath),
    resilientProviderGovernance:
      /assertBudgetAllowsUsage/.test(resilientContent) &&
      /recordTokenUsage/.test(resilientContent) &&
      fileExists(providerFactoryPath) &&
      /wrapWithResilience/.test(readText(providerFactoryPath)),
    availableProvidersWrapped:
      fileExists(providerFactoryPath) && /wrapWithResilience\(raw\)/.test(readText(providerFactoryPath)),
    deptCostTierRouting: fileExists(deptRuntimePath) && /DEPT_TIER/.test(readText(deptRuntimePath)),
  };

  const score = computeScores(departments, runtime);
  const criticalGaps = buildCriticalGaps(departments, runtime);

  const report: GlobalFindings = {
    timestamp: new Date().toISOString(),
    departments,
    runtime,
    score,
    criticalGaps,
  };

  if (!fileExists(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonOut = path.join(OUT_DIR, 'swarm_strategy_audit_latest.json');
  fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n=== SOGNA SWARM STRATEGY AUDIT ===\n');
  console.log(`Departamentos: ${departments.length}`);
  for (const d of departments) {
    console.log(`  [${d.department}] agents=${d.agentCount} kpi=${d.kpiTracker ?? '—'} llm=${d.llmIntegration}`);
  }
  console.log('\nPuntuacion (0-100):');
  console.log(`  Token governance    : ${score.tokenGovernance}`);
  console.log(`  Cost optimization   : ${score.costOptimization}`);
  console.log(`  API resilience      : ${score.apiResilience}`);
  console.log(`  Dept integration    : ${score.deptIntegration}`);
  console.log('\nBrechas criticas:');
  for (const g of criticalGaps) console.log(`  - ${g}`);
  console.log(`\nJSON: ${jsonOut}\n`);
}

main();
