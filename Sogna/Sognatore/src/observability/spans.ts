import * as otel from './otel.js';

/**
 * Span creation helpers for Sognatore instrumentation.
 */

function _createSpan(name: string, parentSpan?: otel.Span, attributes?: otel.SpanAttributes): otel.Span {
  return new otel.Span(
    name,
    parentSpan ? parentSpan.traceId : undefined,
    parentSpan ? parentSpan.spanId : undefined,
    attributes || {}
  );
}

/**
 * Start a root span for a project.
 */
export function startProjectSpan(projectId: string): otel.Span {
  return _createSpan('project', undefined, {
    'sognatore.project.id': projectId,
    'sognatore.span.type': 'project',
  });
}

/**
 * Start a span for an individual task within a project.
 */
export function startTaskSpan(parentSpan: otel.Span, taskId: string): otel.Span {
  return _createSpan('task', parentSpan, {
    'sognatore.task.id': taskId,
    'sognatore.span.type': 'task',
  });
}

export const VALID_RARV_PHASES = ['REASON', 'ACT', 'REFLECT', 'VERIFY'] as const;
export type RARVPhase = (typeof VALID_RARV_PHASES)[number];

/**
 * Start a span for a RARV cycle phase.
 */
export function startRARVSpan(parentSpan: otel.Span, phase: string): otel.Span {
  const normalizedPhase = phase.toUpperCase() as RARVPhase;
  if (!VALID_RARV_PHASES.includes(normalizedPhase)) {
    throw new Error(`Invalid RARV phase: "${phase}"`);
  }

  return _createSpan(`rarv.${normalizedPhase.toLowerCase()}`, parentSpan, {
    'sognatore.rarv.phase': normalizedPhase,
    'sognatore.span.type': 'rarv',
  });
}

/**
 * Start a span for a quality gate check.
 */
export function startQualityGateSpan(parentSpan: otel.Span, gateName: string, result: string): otel.Span {
  const normalizedResult = (result || '').toLowerCase();
  const passed = normalizedResult === 'pass';

  const span = _createSpan(`quality_gate.${gateName}`, parentSpan, {
    'sognatore.quality_gate.name': gateName,
    'sognatore.quality_gate.result': normalizedResult,
    'sognatore.quality_gate.passed': passed,
    'sognatore.span.type': 'quality_gate',
  });

  if (!passed) {
    span.setStatus(otel.SpanStatusCode.ERROR, `Quality gate "${gateName}" failed`);
  } else {
    span.setStatus(otel.SpanStatusCode.OK);
  }

  return span;
}

export const VALID_AGENT_ACTIONS = ['spawn', 'work', 'complete', 'fail'] as const;
export type AgentAction = (typeof VALID_AGENT_ACTIONS)[number];

/**
 * Start a span for an agent lifecycle event.
 */
export function startAgentSpan(parentSpan: otel.Span, agentType: string, action: string): otel.Span {
  const normalizedAction = action.toLowerCase() as AgentAction;
  if (!VALID_AGENT_ACTIONS.includes(normalizedAction)) {
    throw new Error(`Invalid agent action: "${action}"`);
  }

  const span = _createSpan(`agent.${agentType}.${normalizedAction}`, parentSpan, {
    'sognatore.agent.type': agentType,
    'sognatore.agent.action': normalizedAction,
    'sognatore.span.type': 'agent',
  });

  if (normalizedAction === 'fail') {
    span.setStatus(otel.SpanStatusCode.ERROR, `Agent "${agentType}" failed`);
  }

  return span;
}

/**
 * Start a span for a completion council review.
 */
export function startCouncilSpan(parentSpan: otel.Span, reviewerType: string, verdict: string): otel.Span {
  const normalizedVerdict = (verdict || '').toLowerCase();
  const approved = normalizedVerdict === 'approve';

  const span = _createSpan(`council.${reviewerType}`, parentSpan, {
    'sognatore.council.reviewer': reviewerType,
    'sognatore.council.verdict': normalizedVerdict,
    'sognatore.council.approved': approved,
    'sognatore.span.type': 'council',
  });

  if (normalizedVerdict === 'reject') {
    span.setStatus(otel.SpanStatusCode.ERROR, `Council reviewer "${reviewerType}" rejected`);
  } else if (approved) {
    span.setStatus(otel.SpanStatusCode.OK);
  }

  return span;
}
