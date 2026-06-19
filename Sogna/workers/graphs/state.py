"""
Definiciones TypedState compartidas entre los grafos LangGraph de Sogna.

Cada grafo tiene su propio estado; los campos comunes están documentados aquí.
"""
from __future__ import annotations

import datetime
from typing import Any
from typing_extensions import TypedDict, NotRequired


class PhaseResult(TypedDict):
    phase: str
    status: str          # "ok" | "skip" | "error"
    items_processed: int
    detail: str
    elapsed_s: float


class UMAConsolidationState(TypedDict):
    """Estado del pipeline de consolidación sináptica (3+1 fases)."""
    started_at: str
    phase_results: list[PhaseResult]
    current_phase: str
    errors: list[str]
    completed: bool
    # Outputs por fase (opcionales hasta que la fase se ejecute)
    phase1_logs: NotRequired[int]
    phase2_sources: NotRequired[int]
    phase3_nodes: NotRequired[int]
    phase4_pruned: NotRequired[int]
    elapsed_s: NotRequired[float]


class UMAIndexState(TypedDict):
    """Estado del pipeline de indexación vectorial UMA."""
    started_at: str
    provider: str        # "supabase" | "chroma"
    layers: list[str]    # capas a indexar; [] = todas
    indexed_docs: int
    verified: bool
    graph_reloaded: bool
    errors: list[str]
    completed: bool
    elapsed_s: NotRequired[float]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
