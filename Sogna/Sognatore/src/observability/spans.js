'use strict';

/**
 * Span creation helpers for Sognatore instrumentation.
 *
 * Provides typed span constructors for the RARV cycle, quality gates,
 * agent lifecycle, and completion council.
 *
 * All span functions accept an optional parentSpan to build trace hierarchies.
 * When a parentSpan is provided, the child span inherits the traceId and
 * references the parent's spanId.
 */

const otel = require('./otel');

// -------------------------------------------------------------------
// Helper: create a child span from a parent
// -------------------------------------------------------------------

function _createSpan(name, parentSpan, attributes) {
  // Always use our custom Span class for consistent interface.
  // The real OTEL SDK tracer (when available) returns span objects with
  // a different API (spanContext(), etc.) that breaks our attribute access.
  return new otel.Span(
    name,
    parentSpan ? parentSpan.traceId : undefined,
    parentSpan ? parentSpan.spanId : undefined,
    attributes || {}
  );
}

// -------------------------------------------------------------------
// Project span - root span for an entire project execution
// -------------------------------------------------------------------

/**
 * Start a root span for a project.
 * @param {string} projectId - The project identifier
 * @returns {Span} The root project span
 */
function startProjectSpan(projectId) {
  const span = _createSpan('project', null, {
    'sognatore.project.id': projectId,
    'sognatore.span.type': 'project',
  });
  return span;
}

// -------------------------------------------------------------------
// Task span - child of a project span
// -------------------------------------------------------------------

/**
 * Start a span for an individual task within a project.
 * @param {Span} parentSpan - The parent project span
 * @param {string} taskId - The task identifier
 * @returns {Span} The task span
 */
function startTaskSpan(parentSpan, taskId) {
  const span = _createSpan('task', parentSpan, {
    'sognatore.task.id': taskId,
    'sognatore.span.type': 'task',
  });
  return span;
}

// -------------------------------------------------------------------
// RARV cycle span - child of a task span
// -------------------------------------------------------------------

const VALID_RARV_PHASES = ['REASON', 'ACT', 'REFLECT', 'VERIFY'];

/**
 * Start a span for a RARV cycle phase.
 * @param {Span} parentSpan - The parent task span
 * @param {string} phase - One of: REASON, ACT, REFLECT, VERIFY
 * @returns {Span} The RARV phase span
 */
function startRARVSpan(parentSpan, phase) {
  const normalizedPhase = (phase || '').toUpperCase();
  if (!VALID_RARV_PHASES.includes(normalizedPhase)) {
    throw new Error(
      `Invalid RARV phase: "${phase}". Must be one of: ${VALID_RARV_PHASES.join(', ')}`
    );
  }

  const span = _createSpan(`rarv.${normalizedPhase.toLowerCase()}`, parentSpan, {
    'sognatore.rarv.phase': normalizedPhase,
    'sognatore.span.type': 'rarv',
  });
  return span;
}

// -------------------------------------------------------------------
// Quality gate span - child of a task or RARV span
// -------------------------------------------------------------------

/**
 * Start a span for a quality gate check.
 * @param {Span} parentSpan - The parent span
 * @param {string} gateName - Name of the quality gate
 * @param {string} result - 'pass' or 'fail'
 * @returns {Span} The quality gate span
 */
function startQualityGateSpan(parentSpan, gateName, result) {
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

// -------------------------------------------------------------------
// Agent lifecycle span - child of a task span
// -------------------------------------------------------------------

const VALID_AGENT_ACTIONS = ['spawn', 'work', 'complete', 'fail'];

/**
 * Start a span for an agent lifecycle event.
 * @param {Span} parentSpan - The parent span
 * @param {string} agentType - Type of agent (e.g., 'code-review', 'test-writer')
 * @param {string} action - One of: spawn, work, complete, fail
 * @returns {Span} The agent span
 */
function startAgentSpan(parentSpan, agentType, action) {
  const normalizedAction = (action || '').toLowerCase();
  if (!VALID_AGENT_ACTIONS.includes(normalizedAction)) {
    throw new Error(
      `Invalid agent action: "${action}". Must be one of: ${VALID_AGENT_ACTIONS.join(', ')}`
    );
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

// -------------------------------------------------------------------
// Council review span - child of a task span
// -------------------------------------------------------------------

/**
 * Start a span for a completion council review.
 * @param {Span} parentSpan - The parent span
 * @param {string} reviewerType - Type of reviewer (e.g., 'security', 'performance')
 * @param {string} verdict - The review verdict (e.g., 'approve', 'reject', 'request-changes')
 * @returns {Span} The council span
 */
function startCouncilSpan(parentSpan, reviewerType, verdict) {
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

module.exports = {
  startProjectSpan,
  startTaskSpan,
  startRARVSpan,
  startQualityGateSpan,
  startAgentSpan,
  startCouncilSpan,
  VALID_RARV_PHASES,
  VALID_AGENT_ACTIONS,
};
