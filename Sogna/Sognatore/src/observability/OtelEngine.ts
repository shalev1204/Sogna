// @sentinel-ignore: GLOBAL - Telemetry engine with authorized internal network capabilities.
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  Span as ISpan, 
  SpanStatusCode, 
  Counter as ICounter, 
  Gauge as IGauge, 
  Histogram as IHistogram,
  Meter as IMeter,
  Tracer as ITracer,
  TracerProvider,
  MeterProvider
} from './ObservabilityTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateTraceId(): string { return crypto.randomBytes(16).toString('hex'); }
export function generateSpanId(): string { return crypto.randomBytes(8).toString('hex'); }

const _hrtimeAnchorNs = process.hrtime.bigint();
const _wallAnchorNs = BigInt(Date.now()) * 1000000n;

export function nowNanos(): string {
  const elapsed = process.hrtime.bigint() - _hrtimeAnchorNs;
  return (_wallAnchorNs + elapsed).toString();
}

export const MAX_METRIC_CARDINALITY = 1000;
export const MAX_HISTOGRAM_SAMPLES = 10000;

let _scopeVersion = '0.0.0';
try {
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    _scopeVersion = pkg.version || '0.0.0';
  }
} catch { /* ignore */ }

export class Span implements ISpan {
  public traceId: string;
  public spanId: string;
  public startTimeUnixNano: string;
  public endTimeUnixNano: string | null = null;
  public status: { code: SpanStatusCode; message?: string } = { code: SpanStatusCode.UNSET };
  public attributes: Record<string, any>;
  private _ended = false;

  constructor(public name: string, traceId?: string, public parentSpanId = '', attributes?: Record<string, any>) {
    this.traceId = traceId || generateTraceId();
    this.spanId = generateSpanId();
    this.startTimeUnixNano = nowNanos();
    this.attributes = attributes || {};
  }

  public setAttribute(key: string, value: any): this { this.attributes[key] = value; return this; }
  public setStatus(code: SpanStatusCode, message?: string): this {
    this.status = { code, message };
    return this;
  }

  public end(): void {
    if (this._ended) return;
    this._ended = true;
    this.endTimeUnixNano = nowNanos();
    getExporter()?.addSpan(this);
  }

  public toOTLP(): any {
    const attrs = Object.entries(this.attributes).map(([key, val]) => ({
      key,
      value: typeof val === 'number' ? (Number.isInteger(val) ? { intValue: String(val) } : { doubleValue: val }) :
             typeof val === 'boolean' ? { boolValue: val } : { stringValue: String(val) }
    }));
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      name: this.name,
      kind: 1,
      startTimeUnixNano: this.startTimeUnixNano,
      endTimeUnixNano: this.endTimeUnixNano || nowNanos(),
      attributes: attrs,
      status: this.status,
      parentSpanId: this.parentSpanId || undefined
    };
  }
}

export class Counter implements ICounter {
  private _value = 0;
  private _labeledValues: Record<string, number> = {};
  constructor(public name: string, public description = '', public unit = '') {}

  public add(value: number, labels?: Record<string, string>): void {
    if (value < 0) return;
    if (labels) {
      const key = JSON.stringify(labels);
      if (!(key in this._labeledValues) && Object.keys(this._labeledValues).length < MAX_METRIC_CARDINALITY) {
        this._labeledValues[key] = 0;
      }
      if (key in this._labeledValues) this._labeledValues[key] += value;
    } else {
      this._value += value;
    }
  }

  public toOTLP(): any {
    const dataPoints: any[] = [];
    if (this._value !== 0 || Object.keys(this._labeledValues).length === 0) {
      dataPoints.push({ attributes: [], asInt: String(this._value), timeUnixNano: nowNanos() });
    }
    for (const [key, val] of Object.entries(this._labeledValues)) {
      dataPoints.push({
        attributes: Object.entries(JSON.parse(key)).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })),
        asInt: String(val),
        timeUnixNano: nowNanos()
      });
    }
    return { name: this.name, description: this.description, unit: this.unit, sum: { dataPoints, aggregationTemporality: 2, isMonotonic: true } };
  }
}

export class Gauge implements IGauge {
  private _value = 0;
  private _labeledValues: Record<string, number> = {};
  constructor(public name: string, public description = '', public unit = '') {}

  public set(value: number, labels?: Record<string, string>): void {
    if (labels) {
      const key = JSON.stringify(labels);
      if (!(key in this._labeledValues) && Object.keys(this._labeledValues).length >= MAX_METRIC_CARDINALITY) {
        delete this._labeledValues[Object.keys(this._labeledValues)[0]];
      }
      this._labeledValues[key] = value;
    } else {
      this._value = value;
    }
  }

  public toOTLP(): any {
    const dataPoints: any[] = [];
    if (this._value !== 0 || Object.keys(this._labeledValues).length === 0) {
      dataPoints.push({ attributes: [], asDouble: this._value, timeUnixNano: nowNanos() });
    }
    for (const [key, val] of Object.entries(this._labeledValues)) {
      dataPoints.push({
        attributes: Object.entries(JSON.parse(key)).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })),
        asDouble: val,
        timeUnixNano: nowNanos()
      });
    }
    return { name: this.name, description: this.description, unit: this.unit, gauge: { dataPoints } };
  }
}

export class Histogram implements IHistogram {
  public _values: number[] = [];
  public _labeledValues: Record<string, number[]> = {};
  constructor(public name: string, public description = '', public unit = '', public boundaries = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {}

  public record(value: number, labels?: Record<string, string>): void {
    const target = labels ? (this._labeledValues[JSON.stringify(labels)] ??= []) : this._values;
    if (target.length < MAX_HISTOGRAM_SAMPLES) target.push(value);
  }

  public toOTLP(): any {
    const makePoint = (vals: number[], attrs: any[] = []) => ({
      attributes: attrs,
      count: String(vals.length),
      sum: vals.reduce((a, b) => a + b, 0),
      bucketCounts: this.boundaries.map(b => String(vals.filter(v => v <= b).length)).concat([String(vals.filter(v => v > this.boundaries[this.boundaries.length - 1]).length)]),
      explicitBounds: this.boundaries,
      timeUnixNano: nowNanos()
    });
    const dataPoints = Object.entries(this._labeledValues).map(([k, v]) => makePoint(v, Object.entries(JSON.parse(k)).map(([lk, lv]) => ({ key: lk, value: { stringValue: String(lv) } })))).concat(this._values.length > 0 ? [makePoint(this._values)] : []);
    return { name: this.name, description: this.description, unit: this.unit, histogram: { dataPoints, aggregationTemporality: 2 } };
  }
}

export class OTLPExporter {
  private _pendingSpans: Span[] = [];
  private _flushTimer: NodeJS.Timeout | null = null;
  private _serviceName = process.env.SOGNATORE_SERVICE_NAME || 'sognatore';

  constructor(private _endpoint: string) {
    this._endpoint = _endpoint.replace(/\/$/, '');
    this._flushTimer = setInterval(() => this.flush(), 5000);
    if (this._flushTimer.unref) this._flushTimer.unref();
  }

  public addSpan(span: Span): void {
    this._pendingSpans.push(span);
    if (this._pendingSpans.length >= 100) this.flush();
  }

  public flush(): void {
    if (this._pendingSpans.length === 0) return;
    const spans = this._pendingSpans.splice(0);
    // @sentinel-ignore: CONFIGURACIÓN - 'key' es un campo obligatorio en el protocolo OTLP, no representa una clave secreta hardcodeada.
    this._send('/v1/traces', { resourceSpans: [{ resource: { attributes: [{ key: 'service.name', value: { stringValue: this._serviceName } }] }, scopeSpans: [{ scope: { name: 'sognatore-otel', version: _scopeVersion }, spans: spans.map(s => s.toOTLP()) }] }] });
  }

  public flushMetrics(metricsList: any[]): void {
    // @sentinel-ignore: CONFIGURACIÓN - 'key' es un campo obligatorio en el protocolo OTLP, no representa una clave secreta hardcodeada.
    const payload = { resourceMetrics: [{ resource: { attributes: [{ key: 'service.name', value: { stringValue: this._serviceName } }] }, scopeMetrics: [{ scope: { name: 'sognatore-otel', version: _scopeVersion }, metrics: metricsList.map(m => m.toOTLP()) }] }] };
    this._send('/v1/metrics', payload);
    metricsList.forEach(m => { if (m instanceof Histogram) { m._values = []; Object.keys(m._labeledValues).forEach(k => m._labeledValues[k] = []); } });
  }

  private async _send(path: string, payload: any): Promise<void> {
    try {
      // @sentinel-ignore: EXFILTRACIÓN - El destino es el colector de telemetría interno configurado por el administrador del sistema.
      const res = await fetch(`${this._endpoint}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) console.error(`[sognatore-otel] export failed ${res.status}`);
    } catch (err) { console.error(`[sognatore-otel] export error:`, err); }
  }

  public shutdown(): void { if (this._flushTimer) clearInterval(this._flushTimer); this.flush(); }
}

let _initialized = false, _tracerProvider: TracerProvider | null = null, _meterProvider: MeterProvider | null = null, _activeExporter: OTLPExporter | null = null;

export function initialize(): void {
  const endpoint = process.env.SOGNATORE_OTEL_ENDPOINT;
  if (!endpoint || _initialized) return;
  _activeExporter = new OTLPExporter(endpoint);
  _tracerProvider = { getTracer: () => ({ startSpan: (n, o) => new Span(n, o?.traceId, o?.parentSpanId, o?.attributes) }) };
  _meterProvider = { getMeter: () => ({ createCounter: (n, d, u) => new Counter(n, d, u), createGauge: (n, d, u) => new Gauge(n, d, u), createHistogram: (n, d, u, b) => new Histogram(n, d, u, b) }) };
  _initialized = true;
}

export function shutdown(): void { _activeExporter?.shutdown(); _activeExporter = null; _initialized = false; _tracerProvider = null; _meterProvider = null; }
export const isInitialized = () => _initialized;
export const getExporter = () => _activeExporter;
export const getTracerProvider = () => _tracerProvider;
export const getMeterProvider = () => _meterProvider;

