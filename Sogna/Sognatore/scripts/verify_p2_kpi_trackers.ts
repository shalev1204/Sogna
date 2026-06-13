/**
 * verify_p2_kpi_trackers.ts — P2: KPI trackers dept/ cableados a Treasurer/CostTracker.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getTokenGovernanceSnapshot,
  persistDeptKPI,
  readDeptKPI,
} from '../src/core/dept/metrics/DeptKPISnapshot.js';
import { resolveInstitutionalRoot } from '../src/core/utils/InstitutionalRoot.js';
import * as policies from '../src/policies/index.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEPT_ROOT = path.resolve(SCRIPT_DIR, '../src/core/dept');
const SOGNA_ROOT = path.resolve(SCRIPT_DIR, '../..');

const DEPTS = [
  'crm', 'finance', 'growth', 'infrastructure', 'legal',
  'marketing', 'operations', 'protection', 'sales', 'studio',
];

const KPI_FILES: Record<string, string> = {
  crm: 'crm/metrics/CRMKPITracker.ts',
  finance: 'finance/metrics/FinanceKPITracker.ts',
  growth: 'growth/metrics/GrowthKPITracker.ts',
  infrastructure: 'infrastructure/metrics/InfrastructureHealthMonitor.ts',
  legal: 'legal/metrics/LegalKPITracker.ts',
  marketing: 'marketing/metrics/KPITracker.ts',
  operations: 'operations/metrics/OperationsKPITracker.ts',
  protection: 'protection/metrics/ProtectionKPITracker.ts',
  sales: 'sales/metrics/SalesKPITracker.ts',
  studio: 'studio/metrics/StudioKPITracker.ts',
};

function main(): void {
  const sharedPath = path.join(DEPT_ROOT, 'metrics/DeptKPISnapshot.ts');
  if (!fs.existsSync(sharedPath)) {
    console.error('FAIL: DeptKPISnapshot.ts no existe');
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;
  console.log('\n=== P2 KPI TRACKER VERIFICATION ===\n');

  for (const dept of DEPTS) {
    const rel = KPI_FILES[dept];
    const full = path.join(DEPT_ROOT, rel);
    const text = fs.readFileSync(full, 'utf8');
    const wired =
      /DeptKPISnapshot/.test(text) &&
      /getTokenGovernanceSnapshot|persistDeptKPI|deriveHealthScore/.test(text);
    if (wired) {
      console.log(`OK  [${dept}] ${path.basename(full)} → Treasurer/CostTracker`);
      ok++;
    } else {
      console.log(`FAIL [${dept}] ${path.basename(full)} sin cableado P2`);
      fail++;
    }
  }

  console.log(`\nEstático: ${ok}/${DEPTS.length} departamentos cableados`);
  if (fail > 0) process.exit(1);

  process.chdir(SOGNA_ROOT);
  policies.init(resolveInstitutionalRoot(SOGNA_ROOT));
  const snap = getTokenGovernanceSnapshot('operations');
  persistDeptKPI('operations', { event: 'p2_verify', probe: true });
  const saved = readDeptKPI<{ event?: string }>('operations');
  const statsFile = path.join(SOGNA_ROOT, '.sognatore', 'stats', 'dept', 'operations.json');

  const runtimeOk =
    snap.budgetRemaining !== Infinity &&
    saved?.event === 'p2_verify' &&
    fs.existsSync(statsFile);

  console.log(runtimeOk ? 'OK  Runtime persist/read DeptKPISnapshot' : 'FAIL Runtime DeptKPISnapshot');
  if (!runtimeOk) process.exit(1);

  console.log('\nP2 KPI trackers verificados.\n');
}

main();
