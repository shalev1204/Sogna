import * as otel from './otel.js';

/**
 * Metric definitions for Sognatore observability.
 */

interface Metrics {
  taskDuration: otel.Histogram;
  qualityGatePass: otel.Counter;
  qualityGateFail: otel.Counter;
  agentActive: otel.Gauge;
  tokensConsumed: otel.Counter;
  councilApprovalRate: otel.Gauge;
}

let _metrics: Metrics | null = null;

/**
 * Initialize all metrics. Must be called after otel.initialize().
 */
export function initMetrics(): Metrics {
  if (_metrics) return _metrics;

  const meter = otel.meterProvider().getMeter('Sognatore');

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

  return _metrics!;
}

/**
 * Get the current metrics instance. Returns null if not initialized.
 */
export function getMetrics(): Metrics | null {
  return _metrics;
}

/**
 * Record a task duration.
 */
export function recordTaskDuration(durationSeconds: number, labels?: Record<string, string>): void {
  if (!_metrics) return;
  _metrics.taskDuration.record(durationSeconds, labels);
}

/**
 * Record a quality gate result.
 */
export function recordQualityGateResult(gateName: string, passed: boolean): void {
  if (!_metrics) return;
  const labels = { gate: gateName };
  if (passed) {
    _metrics.qualityGatePass.add(1, labels);
  } else {
    _metrics.qualityGateFail.add(1, labels);
  }
}

/**
 * Set the active agent count.
 */
export function setActiveAgents(count: number, labels?: Record<string, string>): void {
  if (!_metrics) return;
  _metrics.agentActive.set(count, labels);
}

/**
 * Record tokens consumed.
 */
export function recordTokensConsumed(tokens: number, model: string, agentType: string): void {
  if (!_metrics) return;
  _metrics.tokensConsumed.add(tokens, { model, agentType });
}

/**
 * Set the council approval rate.
 */
export function setCouncilApprovalRate(rate: number): void {
  if (!_metrics) return;
  const clamped = Math.max(0.0, Math.min(1.0, rate));
  _metrics.councilApprovalRate.set(clamped);
}

/**
 * Flush all metrics to the OTLP endpoint.
 */
export function flushMetrics(): any {
  if (!_metrics) return;

  const exporter = otel.getExporter();
  if (!exporter) return;

  const metricsList = [
    _metrics.taskDuration,
    _metrics.qualityGatePass,
    _metrics.qualityGateFail,
    _metrics.agentActive,
    _metrics.tokensConsumed,
    _metrics.councilApprovalRate,
  ];

  return exporter.flushMetrics(metricsList);
}

/**
 * Reset metrics instance (for testing).
 */
export function resetMetrics(): void {
  _metrics = null;
}
