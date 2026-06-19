"""
Registro de grafos LangGraph disponibles en Sogna Core F0.

Añadir un grafo aquí lo hace disponible como target de la tarea Celery `langgraph.run`.
"""
from __future__ import annotations

from typing import Callable

# Registro: nombre → función de ejecución
# Cada función acepta **kwargs opcionales y devuelve dict serializable
_REGISTRY: dict[str, Callable[..., dict]] = {}


def register(name: str):
    """Decorador para registrar una función de grafo."""
    def decorator(fn: Callable[..., dict]) -> Callable[..., dict]:
        _REGISTRY[name] = fn
        return fn
    return decorator


def get(name: str) -> Callable[..., dict] | None:
    return _REGISTRY.get(name)


def list_graphs() -> list[str]:
    return sorted(_REGISTRY.keys())


# ---------------------------------------------------------------------------
# Registrar grafos F0
# ---------------------------------------------------------------------------

from workers.graphs.uma_consolidation import run_consolidation_graph
from workers.graphs.uma_index import run_index_graph


@register("uma_consolidation")
def _run_consolidation(**kwargs) -> dict:
    """
    Pipeline de consolidación sináptica (4 fases).
    kwargs: thread_id (str, opcional)
    """
    return run_consolidation_graph(
        thread_id=kwargs.get("thread_id", "uma-consolidation"),
    )


@register("uma_index")
def _run_index(**kwargs) -> dict:
    """
    Pipeline de indexación vectorial UMA.
    kwargs: layers (list[str] | None), thread_id (str)
    """
    return run_index_graph(
        layers=kwargs.get("layers"),
        thread_id=kwargs.get("thread_id", "uma-index"),
    )
