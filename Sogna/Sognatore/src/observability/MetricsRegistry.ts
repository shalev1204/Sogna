import * as otel from './OtelEngine.js';
import { SognatoreMetrics } from './ObservabilityTypes.js';

let _metrics: SognatoreMetrics | null = null;

export function initMetrics(): SognatoreMetrics | null {
  if (_metrics) return _metrics;

  if (!otel.isInitialized()) {
    try {
      otel.initialize();
    } catch {
      return null;
    }
  }

  const meterProvider = otel.getMeterProvider();
  if (!meterProvider) return null;

  const meter = meterProvider.getMeter('sognatore');

  _metrics = {
    taskDuration: meter.createHistogram(
      'sognatore_task_duration_seconds',
      'Duration of task execution in seconds',
      's',
      [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600]
    ),
    qualityGatePass: meter.createCounter(
      'sognatore_quality_gate_pass_total',
      'Total number of quality gate passes',
      '{passes}'
    ),
    qualityGateFail: meter.createCounter(
      'sognatore_quality_gate_fail_total',
      'Total number of quality gate failures',
      '{failures}'
    ),
    agentActive: meter.createGauge(
      'sognatore_agent_active',
      'Number of currently active agents',
      '{agents}'
    ),
    tokensConsumed: meter.createCounter(
      'sognatore_tokens_consumed_total',
      'Total tokens consumed by model and agent type',
      '{tokens}'
    ),
    councilApprovalRate: meter.createGauge(
      'sognatore_council_approval_rate',
      'Current council approval rate (0.0 to 1.0)',
      '1'
    ),
  };

  return _metrics;
}

export function getMetrics(): SognatoreMetrics | null {
  return _metrics;
}

export function recordTaskDuration(durationSeconds: number, labels?: Record<string, string>): void {
  _metrics?.taskDuration.record(durationSeconds, labels);
}

export function recordQualityGateResult(gateName: string, passed: boolean): void {
  if (!_metrics) return;
  const labels = { gate: gateName };
  if (passed) {
    _metrics.qualityGatePass.add(1, labels);
  } else {
    _metrics.qualityGateFail.add(1, labels);
  }
}

export function setActiveAgents(count: number, labels?: Record<string, string>): void {
  _metrics?.agentActive.set(count, labels);
}

export function recordTokensConsumed(tokens: number, model: string, agentType: string): void {
  _metrics?.tokensConsumed.add(tokens, { model, agentType });
}

export function setCouncilApprovalRate(rate: number): void {
  if (!_metrics) return;
  const clamped = Math.max(0.0, Math.min(1.0, rate));
  _metrics.councilApprovalRate.set(clamped);
}

export function flushMetrics(): void {
  if (!_metrics) return;
  const exporter = otel.getExporter();
  if (exporter) {
    exporter.flushMetrics(Object.values(_metrics));
  }
}

export function resetMetrics(): void {
  _metrics = null;
}
