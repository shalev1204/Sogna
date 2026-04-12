export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface Span {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string | null;
  status: { code: SpanStatusCode; message?: string };
  attributes: Record<string, any>;
  end(): void;
  setAttribute(key: string, value: any): this;
  setStatus(code: SpanStatusCode, message?: string): this;
}

export interface Counter {
  add(value: number, labels?: Record<string, string>): void;
}

export interface Gauge {
  set(value: number, labels?: Record<string, string>): void;
}

export interface Histogram {
  record(value: number, labels?: Record<string, string>): void;
}

export interface Meter {
  createCounter(name: string, description?: string, unit?: string): Counter;
  createGauge(name: string, description?: string, unit?: string): Gauge;
  createHistogram(name: string, description?: string, unit?: string, boundaries?: number[]): Histogram;
}

export interface Tracer {
  startSpan(name: string, options?: { traceId?: string; parentSpanId?: string; attributes?: Record<string, any> }): Span;
}

export interface TracerProvider {
  getTracer(name: string): Tracer;
}

export interface MeterProvider {
  getMeter(name: string): Meter;
}

export interface SognatoreMetrics {
  taskDuration: Histogram;
  qualityGatePass: Counter;
  qualityGateFail: Counter;
  agentActive: Gauge;
  tokensConsumed: Counter;
  councilApprovalRate: Gauge;
}
