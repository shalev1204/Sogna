import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as otelMod from './otel.js';

/**
 * OTEL Bridge - Background process that watches .sognatore/events/pending/ for
 * event files and creates OpenTelemetry spans from RARV cycle events.
 */

const sognatoreDir = process.env.SOGNATORE_DIR || '.sognatore';
const pendingDir = path.join(process.cwd(), sognatoreDir, 'events', 'pending');
const POLL_INTERVAL_MS = 500;

const activeSpans = new Map<string, otelMod.Span>();
let lastProcessedFile = '';

const KNOWN_EVENT_TYPES = new Set([
  'iteration_start', 'iteration_complete',
  'otel_span_start', 'otel_span_end',
  'session_start', 'session_end',
]);

function getEventType(data: any): string {
  const type = data.type || '';
  if (KNOWN_EVENT_TYPES.has(type)) return type;
  if (data.payload && data.payload.action) {
    const combined = `${type}_${data.payload.action}`;
    if (KNOWN_EVENT_TYPES.has(combined)) return combined;
  }
  return type;
}

function getPayload(data: any): any {
  return data.payload || data.data || {};
}

export function processEventFile(filepath: string, tracer: any, traceId: string): void {
  let raw: string;
  try {
    raw = fs.readFileSync(filepath, 'utf8');
  } catch {
    return;
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  const eventType = getEventType(data);
  const payload = getPayload(data);

  switch (eventType) {
    case 'iteration_start': {
      const iteration = payload.iteration || payload.action || '';
      const spanName = `rarv.iteration.${iteration}`;
      const span = tracer.startSpan('rarv.iteration', {
        traceId: traceId,
        attributes: {
          'rarv.iteration': String(iteration),
          'rarv.provider': payload.provider || '',
        },
      });
      activeSpans.set(spanName, span);
      break;
    }

    case 'iteration_complete': {
      const iteration = payload.iteration || payload.action || '';
      const key = `rarv.iteration.${iteration}`;
      const span = activeSpans.get(key);
      if (span) {
        const statusCode = payload.status === 'completed'
          ? otelMod.SpanStatusCode.OK
          : otelMod.SpanStatusCode.ERROR;
        span.setStatus(statusCode, payload.status || '');
        span.setAttribute('rarv.exit_code', String(payload.exit_code || payload.exitCode || '0'));
        span.end();
        activeSpans.delete(key);
      }
      break;
    }

    case 'otel_span_start': {
      const spanName = payload.span_name || payload.action || 'unknown';
      const attrs: any = {};
      for (const [k, v] of Object.entries(payload)) {
        if (k !== 'action') attrs[k] = String(v);
      }
      const span = tracer.startSpan(spanName, {
        traceId: traceId,
        attributes: attrs,
      });
      activeSpans.set(spanName, span);
      break;
    }

    case 'otel_span_end': {
      const spanName = payload.span_name || payload.action || 'unknown';
      const span = activeSpans.get(spanName);
      if (span) {
        if (payload.status) {
          const code = payload.status === 'ok'
            ? otelMod.SpanStatusCode.OK
            : otelMod.SpanStatusCode.ERROR;
          span.setStatus(code, payload.status);
        }
        span.end();
        activeSpans.delete(spanName);
      }
      break;
    }

    case 'session_start': {
      const span = tracer.startSpan('sognatore.session', {
        traceId: traceId,
        attributes: {
          'session.provider': payload.provider || '',
          'session.prd': payload.prd || '',
        },
      });
      activeSpans.set('sognatore.session', span);
      break;
    }

    case 'session_end': {
      const span = activeSpans.get('sognatore.session');
      if (span) {
        const code = String(payload.result) === '0'
          ? otelMod.SpanStatusCode.OK
          : otelMod.SpanStatusCode.ERROR;
        span.setStatus(code);
        span.setAttribute('session.iterations', String(payload.iterations || '0'));
        span.end();
        activeSpans.delete('sognatore.session');
      }
      break;
    }
  }
}

function scanPendingEvents(tracer: any, traceId: string): void {
  if (!fs.existsSync(pendingDir)) return;
  try {
    const files = fs.readdirSync(pendingDir)
      .filter(f => f.endsWith('.json'))
      .sort();
    for (const file of files) {
      if (file > lastProcessedFile) {
        processEventFile(path.join(pendingDir, file), tracer, traceId);
        lastProcessedFile = file;
      }
    }
  } catch { /* ignore */ }
}

let pollInterval: NodeJS.Timeout | null = null;

export function start(): any {
  otelMod.initialize();

  const tracer = otelMod.tracerProvider().getTracer('sognatore');
  const traceId = process.env.SOGNATORE_TRACE_ID || crypto.randomBytes(16).toString('hex');

  const boundScanPendingEvents = () => scanPendingEvents(tracer, traceId);
  pollInterval = setInterval(boundScanPendingEvents, POLL_INTERVAL_MS);
  boundScanPendingEvents();

  const shutdownFn = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    for (const span of activeSpans.values()) {
      span.setStatus(otelMod.SpanStatusCode.ERROR, 'bridge_shutdown');
      span.end();
    }
    activeSpans.clear();

    const exporter = otelMod.getExporter();
    if (exporter) exporter.flush();
    otelMod.shutdown();
  };

  return {
    scanPendingEvents: boundScanPendingEvents,
    activeSpans,
    shutdown: shutdownFn,
  };
}
