/**
 * verify_p4_ci.ts — P4: valida que verify:p0 está cableado para CI.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNATORE_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOGNA_ROOT = path.resolve(SOGNATORE_ROOT, '..');
const GIT_ROOT = path.resolve(SOGNA_ROOT, '..');
const WORKFLOW_PATH = path.join(GIT_ROOT, '.github/workflows/sognatore-p0.yml');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function main(): void {
  const checks: Check[] = [];
  const sognatorePkg = JSON.parse(read(path.join(SOGNATORE_ROOT, 'package.json'))) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const sognaPkg = JSON.parse(read(path.join(SOGNA_ROOT, 'package.json'))) as {
    scripts?: Record<string, string>;
  };

  checks.push({
    name: 'Sognatore expone verify:p0',
    ok: sognatorePkg.scripts?.['verify:p0']?.includes('verify_p0_all') === true,
    detail: 'pnpm --filter Sognatore verify:p0',
  });
  checks.push({
    name: 'tsx disponible en devDependencies Sognatore',
    ok: Boolean(sognatorePkg.devDependencies?.tsx),
    detail: 'Ejecución determinista en CI sin npx implícito',
  });
  checks.push({
    name: 'Monorepo expone verify:p0 delegado',
    ok: sognaPkg.scripts?.['verify:p0']?.includes('Sognatore') === true,
    detail: 'pnpm verify:p0 desde Sogna/',
  });
  checks.push({
    name: 'Workflow GitHub Actions sognatore-p0.yml',
    ok: fs.existsSync(WORKFLOW_PATH),
    detail: WORKFLOW_PATH,
  });

  if (fs.existsSync(WORKFLOW_PATH)) {
    const workflow = read(WORKFLOW_PATH);
    checks.push({
      name: 'Workflow ejecuta pnpm --filter Sognatore verify:p0',
      ok: /--filter Sognatore verify:p0/.test(workflow),
      detail: 'Job verify-p0 en ubuntu-latest',
    });
    checks.push({
      name: 'Workflow usa working-directory Sogna',
      ok: /working-directory:\s*Sogna/.test(workflow),
      detail: 'Raíz monorepo correcta desde git root',
    });
    checks.push({
      name: 'Workflow path filters Sognatore',
      ok: /Sogna\/Sognatore/.test(workflow),
      detail: 'Solo dispara en cambios relevantes',
    });
  }

  console.log('\n=== P4 CI VERIFICATION ===\n');
  let failed = 0;
  for (const c of checks) {
    console.log(`${c.ok ? 'OK' : 'FAIL'}  ${c.name}`);
    console.log(`     ${c.detail}`);
    if (!c.ok) failed++;
  }
  console.log(`\nResultado: ${checks.length - failed}/${checks.length}`);

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\nP4 CI (verify:p0) verificado.\n');
}

main();
