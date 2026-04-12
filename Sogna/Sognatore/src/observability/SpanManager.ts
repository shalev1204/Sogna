import * as otel from './OtelEngine.js';
import { Span, SpanStatusCode } from './ObservabilityTypes.js';

const _activeSpans: Record<string, Span> = {};

export function startSpan(name: string, options?: any): Span | null {
  if (!otel.isInitialized()) {
    try {
      otel.initialize();
    } catch {
      return null;
    }
  }

  const tracerProvider = otel.getTracerProvider();
  if (!tracerProvider) return null;

  const tracer = tracerProvider.getTracer('sognatore');
  const span = tracer.startSpan(name, options);

  // If a tracking ID is provided, store it
  if (options?.trackingId) {
    _activeSpans[options.trackingId] = span;
  }

  return span;
}

export function endSpan(span: Span, status: SpanStatusCode = SpanStatusCode.OK, message?: string): void {
  if (!span) return;
  span.setStatus(status, message);
  span.end();
}

export function getActiveSpan(trackingId: string): Span | undefined {
  return _activeSpans[trackingId];
}

export function endActiveSpan(trackingId: string, status: SpanStatusCode = SpanStatusCode.OK, message?: string): void {
  const span = _activeSpans[trackingId];
  if (span) {
    endSpan(span, status, message);
    delete _activeSpans[trackingId];
  }
}

/**
 * Execute an async function within a span.
 */
export async function withSpan<T>(
  name: string, 
  fn: (span: Span) => Promise<T>, 
  options?: any
): Promise<T> {
  const span = startSpan(name, options);
  if (!span) return fn({} as any); // Fallback to no-op

  try {
    const result = await fn(span);
    endSpan(span, SpanStatusCode.OK);
    return result;
  } catch (error: any) {
    endSpan(span, SpanStatusCode.ERROR, error.message);
    throw error;
  }
}
