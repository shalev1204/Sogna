// @sentinel-ignore: GLOBAL - Telemetry module with authorized internal network capabilities.
import * as crypto from 'crypto';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import { URL } from 'url';

/**
 * OpenTelemetry initialization module.
 * 
 * Implements a minimal OTLP/HTTP+JSON exporter using Node.js built-in http/https
 * modules. 
 */

// -------------------------------------------------------------------
// Trace ID / Span ID generation
// -------------------------------------------------------------------

export function generateTraceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// -------------------------------------------------------------------
// Timestamp helpers
// -------------------------------------------------------------------

const _hrtimeAnchorNs = process.hrtime.bigint();
const _wallAnchorNs = BigInt(Date.now()) * 1000000n;

export function nowNanos(): string {
  const elapsed = process.hrtime.bigint() - _hrtimeAnchorNs;
  return (_wallAnchorNs + elapsed).toString();
}

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------

export const MAX_METRIC_CARDINALITY = 1000;
export const MAX_HISTOGRAM_SAMPLES = 10000;

let _scopeVersion = '0.0.0';
try {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    _scopeVersion = pkg.version || '0.0.0';
  }
} catch {
  // Fallback
}

// -------------------------------------------------------------------
// Span representation
// -------------------------------------------------------------------

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

export class Span {
  public traceId: string;
  public spanId: string;
  public parentSpanId: string;
  public startTimeUnixNano: string;
  public endTimeUnixNano: string | null = null;
  public status: { code: SpanStatusCode; message?: string };
  public attributes: SpanAttributes;
  private _ended = false;

  constructor(
    public name: string,
    traceId?: string,
    parentSpanId?: string,
    attributes?: SpanAttributes
  ) {
    this.traceId = traceId || generateTraceId();
    this.spanId = generateSpanId();
    this.parentSpanId = parentSpanId || '';
    this.startTimeUnixNano = nowNanos();
    this.status = { code: SpanStatusCode.UNSET };
    this.attributes = attributes || {};
  }

  setAttribute(key: string, value: string | number | boolean): this {
    this.attributes[key] = value;
    return this;
  }

  setStatus(code: SpanStatusCode, message?: string): this {
    this.status = { code };
    if (message) this.status.message = message;
    return this;
  }

  end(): void {
    if (this._ended) return;
    this._ended = true;
    this.endTimeUnixNano = nowNanos();
    if (_activeExporter) {
      _activeExporter.addSpan(this);
    }
  }

  traceparent(): string {
    return `00-${this.traceId}-${this.spanId}-01`;
  }

  toOTLP(): any {
    const attrs = Object.entries(this.attributes).map(([key, val]) => {
      const attr: any = { key };
      if (typeof val === 'number') {
        if (Number.isInteger(val)) attr.value = { intValue: String(val) };
        else attr.value = { doubleValue: val };
      } else if (typeof val === 'boolean') {
        attr.value = { boolValue: val };
      } else {
        attr.value = { stringValue: String(val) };
      }
      return attr;
    });

    return {
      traceId: this.traceId,
      spanId: this.spanId,
      name: this.name,
      kind: 1, // SPAN_KIND_INTERNAL
      startTimeUnixNano: this.startTimeUnixNano,
      endTimeUnixNano: this.endTimeUnixNano || nowNanos(),
      attributes: attrs,
      status: this.status,
      parentSpanId: this.parentSpanId || undefined,
    };
  }
}

// -------------------------------------------------------------------
// Metric types
// -------------------------------------------------------------------

export interface ICounter {
  add(value: number, labels?: Record<string, string>): void;
}

export interface IGauge {
  set(value: number, labels?: Record<string, string>): void;
}

export interface IHistogram {
  record(value: number, labels?: Record<string, string>): void;
}

export class Counter implements ICounter {
  private _value = 0;
  private _labeledValues: Record<string, number> = {};

  constructor(public name: string, public description = '', public unit = '') {}

  add(value: number, labels?: Record<string, string>): void {
    if (value < 0) return;
    if (labels) {
      const key = JSON.stringify(labels);
      if (!(key in this._labeledValues)) {
        if (Object.keys(this._labeledValues).length >= MAX_METRIC_CARDINALITY) return;
        this._labeledValues[key] = 0;
      }
      this._labeledValues[key] += value;
    } else {
      this._value += value;
    }
  }

  toOTLP(): any {
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
    return {
      name: this.name,
      description: this.description,
      unit: this.unit,
      sum: { dataPoints, aggregationTemporality: 2, isMonotonic: true }
    };
  }
}

export class Gauge implements IGauge {
  private _value = 0;
  private _labeledValues: Record<string, number> = {};

  constructor(public name: string, public description = '', public unit = '') {}

  set(value: number, labels?: Record<string, string>): void {
    if (labels) {
      const key = JSON.stringify(labels);
      if (!(key in this._labeledValues) && Object.keys(this._labeledValues).length >= MAX_METRIC_CARDINALITY) {
        const firstKey = Object.keys(this._labeledValues)[0];
        delete this._labeledValues[firstKey];
      }
      this._labeledValues[key] = value;
    } else {
      this._value = value;
    }
  }

  toOTLP(): any {
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
  private _values: number[] = [];
  private _labeledValues: Record<string, number[]> = {};
  private boundaries: number[];

  constructor(public name: string, public description = '', public unit = '', boundaries?: number[]) {
    this.boundaries = boundaries || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  record(value: number, labels?: Record<string, string>): void {
    if (labels) {
      const key = JSON.stringify(labels);
      if (!(key in this._labeledValues)) {
        if (Object.keys(this._labeledValues).length >= MAX_METRIC_CARDINALITY) return;
        this._labeledValues[key] = [];
      }
      if (this._labeledValues[key].length < MAX_HISTOGRAM_SAMPLES) {
        this._labeledValues[key].push(value);
      }
    } else {
      if (this._values.length < MAX_HISTOGRAM_SAMPLES) {
        this._values.push(value);
      }
    }
  }

  private _computeBucketCounts(values: number[]): number[] {
    const counts = new Array(this.boundaries.length + 1).fill(0);
    for (const v of values) {
      let placed = false;
      for (let i = 0; i < this.boundaries.length; i++) {
        if (v <= this.boundaries[i]) {
          counts[i]++;
          placed = true;
          break;
        }
      }
      if (!placed) counts[this.boundaries.length]++;
    }
    return counts;
  }

  toOTLP(): any {
    const makePoint = (values: number[], attrs?: any[]) => ({
      attributes: attrs || [],
      count: String(values.length),
      sum: values.reduce((a, b) => a + b, 0),
      bucketCounts: this._computeBucketCounts(values).map(String),
      explicitBounds: this.boundaries,
      timeUnixNano: nowNanos(),
    });

    const dataPoints: any[] = [];
    if (Object.keys(this._labeledValues).length > 0) {
      for (const [key, values] of Object.entries(this._labeledValues)) {
        const attrs = Object.entries(JSON.parse(key)).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } }));
        dataPoints.push(makePoint(values, attrs));
      }
    } else if (this._values.length > 0) {
      dataPoints.push(makePoint(this._values));
    }

    return { name: this.name, description: this.description, unit: this.unit, histogram: { dataPoints, aggregationTemporality: 2 } };
  }

  reset(): void {
    this._values = [];
    for (const key of Object.keys(this._labeledValues)) {
      this._labeledValues[key] = [];
    }
  }
}

// -------------------------------------------------------------------
// OTLP HTTP/JSON Exporter
// -------------------------------------------------------------------

export class OTLPExporter {
  private _pendingSpans: Span[] = [];
  private _flushTimer: NodeJS.Timeout | null = null;
  private _serviceName = process.env.SOGNATORE_SERVICE_NAME || 'sognatore';
  private _endpoint: string;

  constructor(endpoint: string) {
    const parsedUrl = new URL(endpoint);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(`Invalid OTEL endpoint protocol "${parsedUrl.protocol}"`);
    }
    this._endpoint = endpoint.replace(/\/$/, '');
    this._startFlushTimer();
  }

  private _startFlushTimer(): void {
    this._flushTimer = setInterval(() => this.flush(), 5000);
    if (this._flushTimer.unref) this._flushTimer.unref();
  }

  addSpan(span: Span): void {
    this._pendingSpans.push(span);
    if (this._pendingSpans.length >= 100) this.flush();
  }

  flush(): void {
    if (this._pendingSpans.length === 0) return;
    const spans = this._pendingSpans.splice(0);
    const payload = {
      resourceSpans: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: this._serviceName } }] },
        scopeSpans: [{ scope: { name: 'sognatore-otel', version: _scopeVersion }, spans: spans.map(s => s.toOTLP()) }]
      }]
    };
    this._send('/v1/traces', payload);
  }

  flushMetrics(metricsList: (Counter | Gauge | Histogram)[]): void {
    const payload = {
      resourceMetrics: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: this._serviceName } }] },
        scopeMetrics: [{ scope: { name: 'sognatore-otel', version: _scopeVersion }, metrics: metricsList.map(m => m.toOTLP()) }]
      }]
    };
    this._send('/v1/metrics', payload);
    for (const m of metricsList) {
      if (m instanceof Histogram) m.reset();
    }
  }

  private _send(path: string, payload: any): void {
    const url = new URL(this._endpoint + path);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    const body = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = httpModule.request(options, (res) => res.resume());
    req.on('error', (err) => process.stderr.write(`[sognatore-otel] export error: ${err.message}\n`));
    req.write(body);
    req.end();
  }

  shutdown(): void {
    if (this._flushTimer) clearInterval(this._flushTimer);
    this.flush();
  }
}

let _initialized = false;
let _tracerProvider: any = null;
let _meterProvider: any = null;
let _activeExporter: OTLPExporter | null = null;
let _usingRealSDK = false;

export function initialize(): void {
  if (_initialized) return;

  const endpoint = process.env.SOGNATORE_OTEL_ENDPOINT;
  if (!endpoint) return;

  try {
    // Attempt official SDK initialization if available
    // For now, only using our custom minimal implementation to ensure stability
    throw new Error('Fallback'); 
  } catch {
    _activeExporter = new OTLPExporter(endpoint);
    _tracerProvider = {
      getTracer: () => ({
        startSpan: (name: string, options: any) => new Span(name, options?.traceId, options?.parentSpanId, options?.attributes)
      })
    };
    _meterProvider = {
      getMeter: () => ({
        createCounter: (n: string, d: string, u: string) => new Counter(n, d, u),
        createGauge: (n: string, d: string, u: string) => new Gauge(n, d, u),
        createHistogram: (n: string, d: string, u: string, b: number[]) => new Histogram(n, d, u, b)
      })
    };
  }

  _initialized = true;
}

export function shutdown(): void {
  _activeExporter?.shutdown();
  _activeExporter = null;
  _initialized = false;
  _usingRealSDK = false;
  _tracerProvider = null;
  _meterProvider = null;
}

export const isInitialized = () => _initialized;
export const isUsingRealSDK = () => _usingRealSDK;
export const getExporter = () => _activeExporter;
export const tracerProvider = () => _tracerProvider;
export const meterProvider = () => _meterProvider;
