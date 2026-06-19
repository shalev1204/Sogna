"""
Tareas Celery — Sogna Core F0

Categorías:
  memory.*      — indexación y recall vectorial
  script.*      — ejecución de scripts deterministas
  ollama.*      — generación LLM local vía Ollama
  batch.*       — procesamiento masivo de documentos
  langgraph.*   — ejecución de grafos de estado LangGraph (F0)
"""
import os
import sys
import subprocess
import json
import logging
from pathlib import Path

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

try:
    from memory.identity.load_env import load_sogna_env
    load_sogna_env()
except Exception:
    pass

from workers.celery_app import app

logger = logging.getLogger(__name__)


def _sogna_root() -> Path:
    return Path(_ROOT)


# ---------------------------------------------------------------------------
# memory.reindex — Reindexar toda la memoria UMA en el vector store
# ---------------------------------------------------------------------------

@app.task(bind=True, name="memory.reindex", max_retries=2)
def memory_reindex(self, layers: list[str] | None = None):
    """
    Reindexar memoria UMA en Supabase pgvector.
    layers: lista de capas a reindexar; None = todas.
    """
    try:
        root = _sogna_root()
        cmd = [
            sys.executable,
            str(root / "memory" / "identity" / "index_uma.py"),
        ]
        if layers:
            cmd += ["--layers"] + layers

        result = subprocess.run(
            cmd,
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=300,
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "returncode": result.returncode,
            "stdout": result.stdout[-4000:] if result.stdout else "",
            "stderr": result.stderr[-2000:] if result.stderr else "",
        }
    except subprocess.TimeoutExpired as exc:
        raise self.retry(exc=exc, countdown=30)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


# ---------------------------------------------------------------------------
# memory.doctor — Ejecutar uma-doctor y devolver diagnóstico
# ---------------------------------------------------------------------------

@app.task(name="memory.doctor")
def memory_doctor():
    root = _sogna_root()
    result = subprocess.run(
        [sys.executable, str(root / "memory" / "identity" / "uma-doctor.py")],
        cwd=str(root),
        capture_output=True,
        text=True,
        timeout=60,
    )
    return {
        "status": "ok" if result.returncode == 0 else "error",
        "returncode": result.returncode,
        "output": result.stdout[-6000:],
    }


# ---------------------------------------------------------------------------
# script.run — Ejecutar un script registrado del worker queue
# ---------------------------------------------------------------------------

@app.task(bind=True, name="script.run", max_retries=1)
def script_run(self, cmd: list[str], cwd: str | None = None):
    """
    Ejecutar un comando arbitrario como tarea Celery.
    cmd: lista de strings, e.g. ["python", "scripts/my_script.py", "--arg"]
    cwd: directorio de trabajo; por defecto sogna_root.
    """
    if not cmd:
        return {"status": "error", "message": "cmd vacío"}

    root = _sogna_root()
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or str(root),
            capture_output=True,
            text=True,
            timeout=120,
        )
        return {
            "status": "ok" if result.returncode == 0 else "error",
            "returncode": result.returncode,
            "stdout": result.stdout[-4000:],
            "stderr": result.stderr[-2000:],
        }
    except subprocess.TimeoutExpired as exc:
        raise self.retry(exc=exc, countdown=15)


# ---------------------------------------------------------------------------
# ollama.generate — Generar texto con Ollama (local LLM)
# ---------------------------------------------------------------------------

@app.task(
    bind=True,
    name="ollama.generate",
    max_retries=2,
    # soft_time_limit no soportado en Windows (sin SIGUSR1); celery_app.py ya lo gestiona
    time_limit=300,
)
def ollama_generate(self, prompt: str, model: str = "llama3.2", options: dict | None = None):
    """
    Invocar Ollama para generación de texto local.
    model: nombre del modelo instalado en Ollama.
    options: dict con parámetros Ollama (temperature, num_predict, etc.)
    """
    import urllib.request
    import urllib.error

    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": options or {},
    }).encode()

    req = urllib.request.Request(
        f"{ollama_url}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as resp:
            data = json.loads(resp.read())
        return {
            "status": "ok",
            "model": model,
            "response": data.get("response", ""),
            "done": data.get("done", False),
            "eval_count": data.get("eval_count", 0),
        }
    except urllib.error.URLError as exc:
        raise self.retry(exc=exc, countdown=20)


# ---------------------------------------------------------------------------
# batch.process — Procesar lista de elementos en paralelo (subtareas Celery)
# ---------------------------------------------------------------------------

@app.task(name="batch.process")
def batch_process(items: list[dict], task_name: str, common_opts: dict | None = None):
    """
    Dispatcher de batch: lanza `task_name` para cada item de `items`.
    Devuelve lista de AsyncResult IDs para seguimiento.
    items: lista de dicts; cada dict se pasa como kwargs a la tarea hija.
    task_name: nombre registrado de la tarea hija (e.g. 'ollama.generate').
    common_opts: kwargs adicionales compartidos por todos los items.
    """
    from celery import group

    target = app.tasks.get(task_name)
    if not target:
        return {"status": "error", "message": f"Tarea desconocida: {task_name}"}

    merged = [dict(common_opts or {}, **item) for item in items]
    job = group(target.s(**kw) for kw in merged)
    result = job.apply_async()
    return {
        "status": "dispatched",
        "task_name": task_name,
        "count": len(items),
        "group_id": result.id,
    }


# ---------------------------------------------------------------------------
# langgraph.run — Ejecutar un grafo LangGraph registrado
# ---------------------------------------------------------------------------

@app.task(bind=True, name="langgraph.run", max_retries=1, time_limit=600)
def langgraph_run(self, graph_name: str, kwargs: dict | None = None):
    """
    Ejecuta un grafo LangGraph registrado en workers.graphs.registry.

    graph_name: nombre del grafo (uma_consolidation, uma_index)
    kwargs: parámetros opcionales del grafo
      - uma_consolidation: thread_id (str)
      - uma_index:         layers (list[str] | None), thread_id (str)

    Devuelve el estado final del grafo como dict.
    """
    try:
        from workers.graphs.registry import get as get_graph, list_graphs
        runner = get_graph(graph_name)
        if runner is None:
            return {
                "status": "error",
                "message": f"Grafo desconocido: '{graph_name}'. Disponibles: {list_graphs()}",
            }
        result = runner(**(kwargs or {}))
        errors = result.get("errors", [])
        return {
            "status": "ok" if not errors else "ok_with_warnings",
            "graph": graph_name,
            "completed": result.get("completed", False),
            "elapsed_s": result.get("elapsed_s"),
            "errors": errors,
            "state": result,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
