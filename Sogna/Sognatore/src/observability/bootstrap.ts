import * as otel from './otel.js';
import { initMetrics, resetMetrics } from './metrics.js';

let _bootstrapped = false;

/**
 * Inicializa métricas in-memory siempre; export OTLP solo si SOGNATORE_OTEL_ENDPOINT está definido.
 */
export function ensureObservability(): void {
  if (_bootstrapped) return;
  otel.initialize();
  initMetrics();
  _bootstrapped = true;
}

export function isObservabilityBootstrapped(): boolean {
  return _bootstrapped;
}

export function isOtelExportEnabled(): boolean {
  return otel.isExportEnabled();
}

/** Apaga export y permite re-inicializar (tests). */
export function shutdownObservability(): void {
  otel.shutdown();
  resetMetrics();
  _bootstrapped = false;
}
