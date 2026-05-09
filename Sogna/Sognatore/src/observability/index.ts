import * as otel from './otel.js';
import * as spans from './spans.js';
import * as metricsModule from './metrics.js';

/**
 * Sognatore OpenTelemetry Observability - Public API
 */

export const NOOP_SPAN = {
  traceId: '00000000000000000000000000000000',
  spanId: '0000000000000000',
  parentSpanId: '',
  name: 'noop',
  attributes: {},
  setAttribute: function () { return this; },
  setStatus: function () { return this; },
  end: function () {},
  traceparent: function () { return '00-00000000000000000000000000000000-0000000000000000-00'; },
} as unknown as otel.Span;

const noopTrace = {
  startProjectSpan: (projectId: string) => NOOP_SPAN,
  startTaskSpan: (parentSpan: otel.Span, taskId: string) => NOOP_SPAN,
  startCycleSpan: (parentSpan: otel.Span, phase: string) => NOOP_SPAN,
  startQualityGateSpan: (parentSpan: otel.Span, gateName: string, result: string) => NOOP_SPAN,
  startAgentSpan: (parentSpan: otel.Span, agentType: string, action: string) => NOOP_SPAN,
  startCouncilSpan: (parentSpan: otel.Span, reviewerType: string, verdict: string) => NOOP_SPAN,
};

const noopMetrics = {
  initMetrics: () => ({}),
  getMetrics: () => null,
  recordTaskDuration: () => {},
  recordQualityGateResult: () => {},
  setActiveAgents: () => {},
  recordTokensConsumed: () => {},
  setCouncilApprovalRate: () => {},
  flushMetrics: () => {},
  resetMetrics: () => {},
};

let _trace: typeof noopTrace | null = null;
let _metrics: typeof metricsModule | null = null;
let _enabled = false;

function _loadFull(): void {
  if (_trace) return;

  otel.initialize();
  metricsModule.initMetrics();

  _trace = {
    startProjectSpan: spans.startProjectSpan,
    startTaskSpan: spans.startTaskSpan,
    startCycleSpan: spans.startCycleSpan,
    startQualityGateSpan: spans.startQualityGateSpan,
    startAgentSpan: spans.startAgentSpan,
    startCouncilSpan: spans.startCouncilSpan,
  };

  _metrics = metricsModule;
  _enabled = true;
}

if (process.env.SOGNATORE_OTEL_ENDPOINT) {
  _loadFull();
}

export function isEnabled(): boolean {
  return _enabled;
}

export function shutdown(): void {
  otel.shutdown();
  _trace = null;
  _metrics = null;
  _enabled = false;
}

export const trace = new Proxy(noopTrace, {
  get(target, prop: keyof typeof noopTrace) {
    return _trace ? _trace[prop] : target[prop];
  }
});

export const metrics = new Proxy(noopMetrics, {
  get(target, prop: string) {
    if (!_metrics) return (target as any)[prop];
    return (prop in _metrics) ? (_metrics as any)[prop] : (target as any)[prop];
  }
}) as unknown as typeof metricsModule;
