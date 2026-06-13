/**
 * verify_p2b_otel.ts — P2b: OTEL end-to-end (TokenRecording → métricas → OTLP traces/metrics).
 * Ejecutar: npx tsx Sognatore/scripts/verify_p2b_otel.ts
 */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOGNATORE_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOGNA_ROOT = path.resolve(SOGNATORE_ROOT, '..');
const SRC = path.join(SOGNATORE_ROOT, 'src');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function read(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runStaticChecks(): Check[] {
  const checks: Check[] = [];
  const tokenRecording = read(path.join(SRC, 'core/utils/TokenRecording.ts'));
  const resilient = read(path.join(SRC, 'providers/ResilientProvider.ts'));
  const otel = read(path.join(SRC, 'observability/otel.ts'));
  const bootstrap = read(path.join(SRC, 'observability/bootstrap.ts'));
  const spans = read(path.join(SRC, 'observability/spans.ts'));

  checks.push({
    name: 'bootstrap ensureObservability centraliza init',
    ok: /ensureObservability/.test(bootstrap) && /initMetrics/.test(bootstrap),
    detail: 'otel.initialize + métricas in-memory',
  });
  checks.push({
    name: 'otel siempre crea providers in-memory',
    ok: /createTracerProvider/.test(otel) && /createMeterProvider/.test(otel) &&
      !/if \(!endpoint\) return/.test(otel),
    detail: 'Export OTLP opcional vía SOGNATORE_OTEL_ENDPOINT',
  });
  checks.push({
    name: 'TokenRecording → ensureObservability + métricas OTEL',
    ok: /ensureObservability/.test(tokenRecording) &&
      /recordTokensConsumed/.test(tokenRecording) &&
      /recordTaskDuration/.test(tokenRecording),
    detail: 'Puente Treasurer + OTEL en un solo sitio',
  });
  checks.push({
    name: 'ResilientProvider emite span llm.invoke',
    ok: /startLlmInvokeSpan/.test(resilient) && /span\.end\(\)/.test(resilient),
    detail: 'Trazas por invoke() e invokeWithTier()',
  });
  checks.push({
    name: 'startLlmInvokeSpan definido en spans.ts',
    ok: /export function startLlmInvokeSpan/.test(spans),
    detail: 'Span raíz con agent.id y llm.model',
  });
  checks.push({
    name: 'BootstrapEngine activa observabilidad al arrancar',
    ok: /ensureObservability/.test(read(path.join(SRC, 'core/BootstrapEngine.ts'))),
    detail: 'Métricas disponibles antes del TelemetryServer',
  });

  return checks;
}

async function runRuntimeCheck(): Promise<void> {
  const payloads: Array<{ path: string; body: unknown }> = [];
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        payloads.push({ path: req.url ?? '', body: JSON.parse(raw) });
      } catch {
        payloads.push({ path: req.url ?? '', body: raw });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    server.close();
    throw new Error('No se pudo abrir collector OTLP mock');
  }

  const prevEndpoint = process.env.SOGNATORE_OTEL_ENDPOINT;
  process.env.SOGNATORE_OTEL_ENDPOINT = `http://127.0.0.1:${addr.port}`;

  try {
    const { shutdownObservability, ensureObservability } =
      await import('../src/observability/bootstrap.js');
    const { flushMetrics, getMetrics } = await import('../src/observability/metrics.js');
    const { getExporter } = await import('../src/observability/otel.js');
    const { startLlmInvokeSpan } = await import('../src/observability/spans.js');
    const { recordTokenUsage } = await import('../src/core/utils/TokenRecording.js');
    const { resolveInstitutionalRoot } = await import('../src/core/utils/InstitutionalRoot.js');
    const policies = await import('../src/policies/index.js');

    shutdownObservability();
    ensureObservability();

    process.chdir(SOGNA_ROOT);
    policies.init(resolveInstitutionalRoot(SOGNA_ROOT));

    const span = startLlmInvokeSpan('p2b-probe', 'test-model', 'verify');
    span.setStatus(1);
    span.end();

    recordTokenUsage({
      agentId: 'p2b-probe',
      model: 'test-model',
      inputTokens: 100,
      outputTokens: 50,
      swarm: 'verify',
      durationMs: 250,
    });

    const metrics = getMetrics();
    if (!metrics) {
      throw new Error('getMetrics() null tras ensureObservability');
    }

    flushMetrics();
    getExporter()?.flush();
    await sleep(300);

    const tracePayload = payloads.find((p) => p.path.includes('/v1/traces'));
    const metricsPayload = payloads.find((p) => p.path.includes('/v1/metrics'));

    if (!tracePayload) {
      throw new Error('No se recibió POST /v1/traces en collector mock');
    }
    if (!metricsPayload) {
      throw new Error('No se recibió POST /v1/metrics en collector mock');
    }

    const traceJson = JSON.stringify(tracePayload.body);
    if (!traceJson.includes('llm.invoke')) {
      throw new Error('Payload traces sin span llm.invoke');
    }
    if (!traceJson.includes('p2b-probe')) {
      throw new Error('Payload traces sin agent.id p2b-probe');
    }

    const metricsJson = JSON.stringify(metricsPayload.body);
    if (!metricsJson.includes('sognatore_tokens_consumed_total')) {
      throw new Error('Payload metrics sin sognatore_tokens_consumed_total');
    }
    if (!metricsJson.includes('test-model')) {
      throw new Error('Payload metrics sin label model=test-model');
    }

    console.log('OK  Runtime OTLP traces + metrics (collector mock)');
  } finally {
    const { shutdownObservability } = await import('../src/observability/bootstrap.js');
    shutdownObservability();
    if (prevEndpoint === undefined) delete process.env.SOGNATORE_OTEL_ENDPOINT;
    else process.env.SOGNATORE_OTEL_ENDPOINT = prevEndpoint;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function main(): Promise<void> {
  console.log('\n=== P2b OTEL END-TO-END VERIFICATION ===\n');

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

  await runRuntimeCheck();
  console.log('\nP2b OTEL end-to-end verificado.\n');
}

main().catch((err) => {
  console.error('FAIL Runtime OTEL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
