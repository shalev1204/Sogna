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
    'Sognatore.project.id': projectId,
    'Sognatore.span.type': 'project',
  });
}

/**
 * Start a span for an individual task within a project.
 */
export function startTaskSpan(parentSpan: otel.Span, taskId: string): otel.Span {
  return _createSpan('task', parentSpan, {
    'Sognatore.task.id': taskId,
    'Sognatore.span.type': 'task',
  });
}

export const VALID_Cycle_PHASES = ['REASON', 'ACT', 'REFLECT', 'VERIFY'] as const;
export type CyclePhase = (typeof VALID_Cycle_PHASES)[number];

/**
 * Start a span for a Cycle phase.
 */
export function startCycleSpan(parentSpan: otel.Span, phase: string): otel.Span {
  const normalizedPhase = phase.toUpperCase() as CyclePhase;
  if (!VALID_Cycle_PHASES.includes(normalizedPhase)) {
    throw new Error(`Invalid Cycle phase: "${phase}"`);
  }

  return _createSpan(`rarv.${normalizedPhase.toLowerCase()}`, parentSpan, {
    'Sognatore.rarv.phase': normalizedPhase,
    'Sognatore.span.type': 'rarv',
  });
}

/**
 * Start a span for a quality gate check.
 */
export function startQualityGateSpan(parentSpan: otel.Span, gateName: string, result: string): otel.Span {
  const normalizedResult = (result || '').toLowerCase();
  const passed = normalizedResult === 'pass';

  const span = _createSpan(`quality_gate.${gateName}`, parentSpan, {
    'Sognatore.quality_gate.name': gateName,
    'Sognatore.quality_gate.result': normalizedResult,
    'Sognatore.quality_gate.passed': passed,
    'Sognatore.span.type': 'quality_gate',
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
    'Sognatore.agent.type': agentType,
    'Sognatore.agent.action': normalizedAction,
    'Sognatore.span.type': 'agent',
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
    'Sognatore.council.reviewer': reviewerType,
    'Sognatore.council.verdict': normalizedVerdict,
    'Sognatore.council.approved': approved,
    'Sognatore.span.type': 'council',
  });

  if (normalizedVerdict === 'reject') {
    span.setStatus(otel.SpanStatusCode.ERROR, `Council reviewer "${reviewerType}" rejected`);
  } else if (approved) {
    span.setStatus(otel.SpanStatusCode.OK);
  }

  return span;
}
