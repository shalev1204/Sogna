"""
UMA Index Graph — Sogna Core F0
==================================
LangGraph StateGraph para el pipeline de indexación vectorial UMA.

Nodos:
  resolve_provider  — detecta el proveedor vectorial activo (supabase / chroma)
  run_indexer       — ejecuta index_uma.py para las capas indicadas
  verify_indexed    — consulta el store y confirma que hay documentos
  reload_graph      — hot-reload del Knowledge Graph en la UMA API (:8080)

La indexación puede reindexar todas las capas o un subconjunto (layers=[...]).

Uso:
  from workers.graphs.uma_index import run_index_graph
  result = run_index_graph(layers=["identity", "operational"])
"""
from __future__ import annotations

import sys
import os
import subprocess
import time
import logging
import urllib.request

from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

from workers.graphs.state import UMAIndexState, now_iso

logger = logging.getLogger(__name__)

_GRAPHS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_GRAPHS_DIR))
_MEMORY_IDENTITY = os.path.join(_PROJECT_ROOT, "memory", "identity")

for _p in [_PROJECT_ROOT, _MEMORY_IDENTITY]:
    if _p not in sys.path:
        sys.path.insert(0, _p)


# ---------------------------------------------------------------------------
# Nodos
# ---------------------------------------------------------------------------

def node_resolve_provider(state: UMAIndexState) -> UMAIndexState:
    """Detecta el proveedor vectorial activo."""
    try:
        from vector_store import resolve_provider  # type: ignore
        provider = resolve_provider()
        state["provider"] = provider
    except Exception as exc:
        logger.warning("resolve_provider error: %s", exc)
        state["provider"] = "unknown"
        state["errors"] = state.get("errors", []) + [f"resolve_provider: {exc}"]
    return state


def node_run_indexer(state: UMAIndexState) -> UMAIndexState:
    """Ejecuta index_uma.py para indexar las capas en el vector store."""
    t0 = time.perf_counter()
    try:
        cmd = [sys.executable, os.path.join(_MEMORY_IDENTITY, "index_uma.py")]
        layers = state.get("layers", [])
        if layers:
            cmd += ["--layers"] + layers

        result = subprocess.run(
            cmd,
            cwd=_PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=300,
        )
        elapsed = round(time.perf_counter() - t0, 2)

        if result.returncode == 0:
            # Intentar extraer número de documentos del stdout
            docs = 0
            for line in result.stdout.splitlines():
                if "documento" in line.lower() or "indexed" in line.lower():
                    import re
                    m = re.search(r"\d+", line)
                    if m:
                        docs = int(m.group())
            state["indexed_docs"] = docs
        else:
            state["errors"] = state.get("errors", []) + [
                f"indexer exit {result.returncode}: {result.stderr[:300]}"
            ]
            state["indexed_docs"] = 0

    except subprocess.TimeoutExpired:
        state["errors"] = state.get("errors", []) + ["indexer timeout (300s)"]
        state["indexed_docs"] = 0
    except Exception as exc:
        state["errors"] = state.get("errors", []) + [f"indexer: {exc}"]
        state["indexed_docs"] = 0

    return state


def node_verify_indexed(state: UMAIndexState) -> UMAIndexState:
    """Verifica que el vector store tiene documentos tras la indexación."""
    try:
        from vector_store import is_ready  # type: ignore
        ready, detail = is_ready()
        state["verified"] = ready
        if not ready:
            state["errors"] = state.get("errors", []) + [f"vector store not ready: {detail}"]
    except Exception as exc:
        logger.warning("verify error: %s", exc)
        state["verified"] = False
        state["errors"] = state.get("errors", []) + [f"verify: {exc}"]
    return state


def node_reload_graph(state: UMAIndexState) -> UMAIndexState:
    """
    Solicita hot-reload del Knowledge Graph en la UMA API.
    Si la API no está levantada, registra warning pero no falla el grafo.
    """
    uma_host = os.environ.get("SOGNA_MCP_HOST", "127.0.0.1")
    uma_port = os.environ.get("SOGNA_UMA_API_PORT", "8080")
    url = f"http://{uma_host}:{uma_port}/memory/system/reload"
    try:
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req, timeout=5) as resp:
            state["graph_reloaded"] = resp.status == 200
    except Exception as exc:
        logger.info("UMA API reload skip (no disponible): %s", exc)
        state["graph_reloaded"] = False

    state["completed"] = True
    return state


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_index_graph(checkpointer: MemorySaver | None = None) -> "StateGraph":
    saver = checkpointer or MemorySaver()

    builder = StateGraph(UMAIndexState)

    builder.add_node("resolve_provider", node_resolve_provider)
    builder.add_node("run_indexer", node_run_indexer)
    builder.add_node("verify_indexed", node_verify_indexed)
    builder.add_node("reload_graph", node_reload_graph)

    builder.add_edge(START, "resolve_provider")
    builder.add_edge("resolve_provider", "run_indexer")
    builder.add_edge("run_indexer", "verify_indexed")
    builder.add_edge("verify_indexed", "reload_graph")
    builder.add_edge("reload_graph", END)

    return builder.compile(checkpointer=saver)


def run_index_graph(
    layers: list[str] | None = None,
    thread_id: str = "uma-index",
) -> dict:
    """
    Entrada pública: indexar capas UMA via LangGraph.
    layers=None → todas las capas.
    """
    graph = build_index_graph()
    initial: UMAIndexState = {
        "started_at": now_iso(),
        "provider": "",
        "layers": layers or [],
        "indexed_docs": 0,
        "verified": False,
        "graph_reloaded": False,
        "errors": [],
        "completed": False,
    }
    config = {"configurable": {"thread_id": thread_id}}
    final_state = graph.invoke(initial, config=config)

    import datetime as _dt
    started = _dt.datetime.fromisoformat(final_state["started_at"].replace("Z", "+00:00"))
    elapsed = (_dt.datetime.now(_dt.timezone.utc) - started).total_seconds()
    final_state["elapsed_s"] = round(elapsed, 2)

    return dict(final_state)
