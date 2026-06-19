"""
UMA Consolidation Graph — Sogna Core F0
=========================================
LangGraph StateGraph que envuelve el pipeline de consolidación sináptica
en 4 fases con estado tipado, routing condicional y checkpointing.

Fases:
  p1_working_to_episodic  — logs → snapshots episódicos
  p2_episodic_to_semantic — episódico → catálogo semántico
  p3_semantic_to_graph    — sincronización del Knowledge Graph
  p4_prune                — poda autónoma de memoria episódica vieja

Routing condicional:
  p1 sin logs nuevos → saltar p2 directamente a p3

OTel: cada nodo emite su propio span hijo bajo el trace raíz del caller.

Uso:
  from workers.graphs.uma_consolidation import build_graph
  graph = build_graph()
  result = graph.invoke(initial_state, config={"configurable": {"thread_id": "run-1"}})
"""
from __future__ import annotations

import sys
import os
import time
import logging

from opentelemetry import trace as _otel_trace

from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

from workers.graphs.state import UMAConsolidationState, PhaseResult, now_iso

logger = logging.getLogger(__name__)

# Asegurar que la raíz del proyecto está en sys.path para importar consolidate
_GRAPHS_DIR = os.path.dirname(os.path.abspath(__file__))
_WORKERS_DIR = os.path.dirname(_GRAPHS_DIR)
_PROJECT_ROOT = os.path.dirname(_WORKERS_DIR)
_MEMORY_IDENTITY = os.path.join(_PROJECT_ROOT, "memory", "identity")

for _p in [_PROJECT_ROOT, _MEMORY_IDENTITY]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Tracer para este módulo — usado por los nodos del grafo
_tracer = _otel_trace.get_tracer("sogna.graphs.uma_consolidation")


# ---------------------------------------------------------------------------
# Nodos del grafo
# ---------------------------------------------------------------------------

def node_p1_working_to_episodic(state: UMAConsolidationState) -> UMAConsolidationState:
    """Fase 1: Working Memory → Episodic Memory."""
    with _tracer.start_as_current_span("uma_consolidation.p1_working_to_episodic") as span:
        t0 = time.perf_counter()
        try:
            import consolidate  # type: ignore
            processed = consolidate.phase1_working_to_episodic()
            span.set_attribute("phase.items_processed", processed)
            span.set_attribute("phase.status", "ok" if processed > 0 else "skip")
            result: PhaseResult = {
                "phase": "p1_working_to_episodic",
                "status": "ok" if processed > 0 else "skip",
                "items_processed": processed,
                "detail": f"{processed} logs procesados",
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["phase1_logs"] = processed
        except Exception as exc:
            span.record_exception(exc)
            span.set_attribute("phase.status", "error")
            logger.warning("p1 error: %s", exc)
            result = {
                "phase": "p1_working_to_episodic",
                "status": "error",
                "items_processed": 0,
                "detail": str(exc),
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["errors"] = state.get("errors", []) + [f"p1: {exc}"]
            state["phase1_logs"] = 0

    state["phase_results"] = state.get("phase_results", []) + [result]
    state["current_phase"] = "p1_done"
    return state


def node_p2_episodic_to_semantic(state: UMAConsolidationState) -> UMAConsolidationState:
    """Fase 2: Episodic Memory → Semantic Memory."""
    with _tracer.start_as_current_span("uma_consolidation.p2_episodic_to_semantic") as span:
        t0 = time.perf_counter()
        try:
            import consolidate  # type: ignore
            cataloged = consolidate.phase2_episodic_to_semantic()
            span.set_attribute("phase.items_processed", cataloged)
            span.set_attribute("phase.status", "ok" if cataloged > 0 else "skip")
            result: PhaseResult = {
                "phase": "p2_episodic_to_semantic",
                "status": "ok" if cataloged > 0 else "skip",
                "items_processed": cataloged,
                "detail": f"{cataloged} fuentes catalogadas",
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["phase2_sources"] = cataloged
        except Exception as exc:
            span.record_exception(exc)
            span.set_attribute("phase.status", "error")
            logger.warning("p2 error: %s", exc)
            result = {
                "phase": "p2_episodic_to_semantic",
                "status": "error",
                "items_processed": 0,
                "detail": str(exc),
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["errors"] = state.get("errors", []) + [f"p2: {exc}"]
            state["phase2_sources"] = 0

    state["phase_results"] = state.get("phase_results", []) + [result]
    state["current_phase"] = "p2_done"
    return state


def node_p3_semantic_to_graph(state: UMAConsolidationState) -> UMAConsolidationState:
    """Fase 3: Semantic Memory → Knowledge Graph sync."""
    with _tracer.start_as_current_span("uma_consolidation.p3_semantic_to_graph") as span:
        t0 = time.perf_counter()
        try:
            import consolidate  # type: ignore
            valid_nodes = consolidate.phase3_semantic_to_graph()
            span.set_attribute("phase.items_processed", valid_nodes)
            span.set_attribute("phase.status", "ok")
            result: PhaseResult = {
                "phase": "p3_semantic_to_graph",
                "status": "ok",
                "items_processed": valid_nodes,
                "detail": f"{valid_nodes} nodos validados",
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["phase3_nodes"] = valid_nodes
        except Exception as exc:
            span.record_exception(exc)
            span.set_attribute("phase.status", "error")
            logger.warning("p3 error: %s", exc)
            result = {
                "phase": "p3_semantic_to_graph",
                "status": "error",
                "items_processed": 0,
                "detail": str(exc),
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["errors"] = state.get("errors", []) + [f"p3: {exc}"]
            state["phase3_nodes"] = 0

    state["phase_results"] = state.get("phase_results", []) + [result]
    state["current_phase"] = "p3_done"
    return state


def node_p4_prune(state: UMAConsolidationState) -> UMAConsolidationState:
    """Fase 4: Autonomous Memory Pruning."""
    with _tracer.start_as_current_span("uma_consolidation.p4_prune") as span:
        t0 = time.perf_counter()
        try:
            import prune  # type: ignore
            pruned = prune.prune()
            span.set_attribute("phase.items_processed", pruned)
            span.set_attribute("phase.status", "ok")
            result: PhaseResult = {
                "phase": "p4_prune",
                "status": "ok",
                "items_processed": pruned,
                "detail": f"{pruned} items podados",
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["phase4_pruned"] = pruned
        except Exception as exc:
            span.record_exception(exc)
            span.set_attribute("phase.status", "error")
            logger.warning("p4 (prune) error: %s", exc)
            result = {
                "phase": "p4_prune",
                "status": "error",
                "items_processed": 0,
                "detail": str(exc),
                "elapsed_s": round(time.perf_counter() - t0, 3),
            }
            state["phase4_pruned"] = 0

    state["phase_results"] = state.get("phase_results", []) + [result]
    state["current_phase"] = "done"
    state["completed"] = True
    return state


# ---------------------------------------------------------------------------
# Routing condicional
# ---------------------------------------------------------------------------

def route_after_p1(state: UMAConsolidationState) -> str:
    """
    Si p1 no procesó logs nuevos (skip), saltamos p2 directamente a p3.
    Ahorra tiempo cuando no hay actividad nueva desde el último ciclo.
    """
    logs = state.get("phase1_logs", 0)
    if logs == 0:
        return "skip_to_p3"
    return "run_p2"


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_graph(checkpointer: MemorySaver | None = None) -> "StateGraph":
    """
    Construye el grafo de consolidación UMA.
    checkpointer=None → MemorySaver por defecto (in-memory F0).
    """
    saver = checkpointer or MemorySaver()

    builder = StateGraph(UMAConsolidationState)

    # Nodos
    builder.add_node("p1", node_p1_working_to_episodic)
    builder.add_node("p2", node_p2_episodic_to_semantic)
    builder.add_node("p3", node_p3_semantic_to_graph)
    builder.add_node("p4", node_p4_prune)

    # Arista inicial
    builder.add_edge(START, "p1")

    # Routing condicional tras p1
    builder.add_conditional_edges(
        "p1",
        route_after_p1,
        {
            "run_p2": "p2",
            "skip_to_p3": "p3",
        },
    )

    # Aristas fijas
    builder.add_edge("p2", "p3")
    builder.add_edge("p3", "p4")
    builder.add_edge("p4", END)

    return builder.compile(checkpointer=saver)


def run_consolidation_graph(thread_id: str = "uma-consolidation") -> dict:
    """
    Entrada pública para ejecutar el grafo de consolidación.
    Devuelve el estado final serializable como dict.
    El span raíz 'uma_consolidation.run' engloba todos los spans de nodo.
    """
    import datetime as _dt

    with _tracer.start_as_current_span("uma_consolidation.run") as span:
        span.set_attribute("graph.thread_id", thread_id)
        graph = build_graph()
        initial: UMAConsolidationState = {
            "started_at": now_iso(),
            "phase_results": [],
            "current_phase": "start",
            "errors": [],
            "completed": False,
        }
        config = {"configurable": {"thread_id": thread_id}}
        final_state = graph.invoke(initial, config=config)

        started = _dt.datetime.fromisoformat(final_state["started_at"].replace("Z", "+00:00"))
        elapsed = (_dt.datetime.now(_dt.timezone.utc) - started).total_seconds()
        final_state["elapsed_s"] = round(elapsed, 2)

        span.set_attribute("graph.completed", final_state.get("completed", False))
        span.set_attribute("graph.elapsed_s", final_state["elapsed_s"])
        errors = final_state.get("errors", [])
        span.set_attribute("graph.error_count", len(errors))
        if errors:
            span.set_attribute("graph.errors", str(errors[:3]))

    return dict(final_state)
