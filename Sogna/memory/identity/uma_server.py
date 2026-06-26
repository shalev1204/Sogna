import os
import json
import logging
import asyncio
import time
import sys
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from load_env import load_sogna_env  # noqa: E402

load_sogna_env()

from vector_store import is_ready as vector_is_ready, query as vector_query, resolve_provider  # noqa: E402

# OpenTelemetry — inicializar antes de configurar logging para que
# LoggingInstrumentor pueda inyectar trace_id en cada línea
try:
    from otel import setup_telemetry, get_tracer as _get_otel_tracer
    setup_telemetry(service_name="sogna-uma")
    from opentelemetry.instrumentation.logging import LoggingInstrumentor
    LoggingInstrumentor().instrument(set_logging_format=True)
    _otel_available = True
except Exception as _otel_exc:
    _otel_available = False
    print(f"[OTel] No disponible en arranque: {_otel_exc}")

# Configuración de Logging con trace_id si OTel disponible
if _otel_available:
    # LoggingInstrumentor ya inyecta otelTraceID y otelSpanID en el formato
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [SOGNA-UMA] %(message)s trace=%(otelTraceID)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        force=True,
    )
else:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [SOGNA-UMA] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
logger = logging.getLogger("UMA-Server")

# Resolucion Absoluta de Rutas del Ecosistema Sogna
MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")

# Estado Global Residente (Warm State)
app_state: Dict[str, Any] = {
    "vector_provider": "unknown",
    "vector_ready": False,
    "vector_detail": "",
    "graph_nodes": [],
    "graph_edges": [],
    "last_activity": time.time(),
    "consolidation_task": None,
    "running": False,
}

IDLE_THRESHOLD_SECONDS = 3600  # 1 hora

async def idle_consolidation_worker():
    """Worker en segundo plano que consolida la memoria si el sistema esta inactivo."""
    while True:
        await asyncio.sleep(60)  # Chequea cada minuto
        if not app_state["running"]:
            break
            
        idle_time = time.time() - app_state["last_activity"]
        if idle_time > IDLE_THRESHOLD_SECONDS:
            logger.info(f"Sistema inactivo por {int(idle_time)}s. Iniciando auto-consolidacion de memoria (Background).")
            try:
                # Add current directory to path if needed for import
                current_dir = os.path.dirname(os.path.abspath(__file__))
                if current_dir not in sys.path:
                    sys.path.append(current_dir)
                    
                import consolidate
                # Run the synchronous consolidation in a thread to not block the async loop
                results = await asyncio.to_thread(consolidate.run_consolidation)
                logger.info(f"Auto-consolidacion completada: {results}")
                # Recargar el grafo inmediatamente
                load_graph()
            except Exception as e:
                logger.error(f"Error en auto-consolidacion: {e}")
            
            # Reset the timer so it doesn't immediately consolidate again
            app_state["last_activity"] = time.time()

def load_graph():
    """Carga el Knowledge Graph Json en memoria RAM."""
    if os.path.exists(GRAPH_PATH):
        try:
            with open(GRAPH_PATH, 'r', encoding='utf-8') as f:
                graph = json.load(f)
                app_state["graph_nodes"] = graph.get('nodes', [])
                app_state["graph_edges"] = graph.get('edges', [])
                logger.info(f"Knowledge Graph (Semantic Memory) cargado: {len(app_state['graph_nodes'])} Nodos, {len(app_state['graph_edges'])} Relaciones.")
        except Exception as e:
            logger.error(f"Error critico al cargar el Knowledge Graph: {e}")
    else:
        logger.warning(f"Knowledge Graph no encontrado en {GRAPH_PATH}. Fase 2 estara inactiva.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestor de ciclo de vida de la aplicacion (Lifespan).
    Sustituye a los eventos 'startup' y 'shutdown' deprecados.
    Mantiene la base de datos vectorial y el grafo pre-cargados en memoria.
    """
    logger.info("Iniciando Secuencia de Arranque de la Memoria Residente UMA...")

    app_state["vector_provider"] = resolve_provider()
    ready, detail = vector_is_ready()
    app_state["vector_ready"] = ready
    app_state["vector_detail"] = detail
    if ready:
        logger.info(f"Vector store listo ({app_state['vector_provider']}): {detail}")
        try:
            await asyncio.wait_for(asyncio.to_thread(vector_query, "warmup", 1), timeout=5.0)
            logger.info("Vector store precalentado (embeddings en cache).")
        except asyncio.TimeoutError:
            logger.warning("Warmup vectorial omitido por timeout (5s).")
        except Exception as e:
            logger.warning(f"Warmup vectorial omitido: {e}")
    else:
        logger.warning(f"Vector store no listo ({app_state['vector_provider']}): {detail}")
    load_graph()
    
    # 3. Iniciar el demonio de auto-consolidacion
    app_state["running"] = True
    app_state["consolidation_task"] = asyncio.create_task(idle_consolidation_worker())
    
    logger.info("API Residente UMA en linea y operando.")
    yield
    
    # Shutdown
    logger.info("Iniciando apagado seguro de la Memoria UMA...")
    app_state["running"] = False
    if app_state.get("consolidation_task"):
        app_state["consolidation_task"].cancel()

    app_state["vector_ready"] = False
    logger.info("Recursos de memoria liberados. Apagado completado.")

# Inicializacion de FastAPI con Metadata Institucional
app = FastAPI(
    title="UMA Resident Memory API",
    description="API de alto rendimiento en estado WARM para la Arquitectura de Memoria Unificada de Sogna.",
    version="2.0.0",
    lifespan=lifespan
)

# OTel — instrumentar FastAPI para trazas HTTP automáticas
if _otel_available:
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        FastAPIInstrumentor.instrument_app(app)
        logger.info("[OTel] FastAPIInstrumentor activo — trazas HTTP habilitadas.")
    except Exception as _fi_exc:
        logger.warning("[OTel] FastAPIInstrumentor no aplicado: %s", _fi_exc)

# Seguridad: CORS Profesional
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restringir en produccion a ["http://localhost:3000", etc]
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ==========================================
# MODELOS PYDANTIC (Validacion de Contratos)
# ==========================================
class QueryRequest(BaseModel):
    query: str = Field(..., description="La busqueda semantica o de intencion del Agente.", min_length=2)
    n_results: int = Field(default=3, description="Numero de resultados top-k del vector store.", ge=1, le=20)

class VectorMatch(BaseModel):
    path: str
    distance: float
    match_percentage: str

class GraphMatch(BaseModel):
    id: str
    label: str
    type: str
    description: str
    score: int

class QueryResponse(BaseModel):
    query: str
    vector_matches: List[VectorMatch]
    graph_matches: List[GraphMatch]
    relations: List[str]
    raw_output: str = Field(..., description="Salida textual formateada retrocompatible con Sognatore v1.")

# ==========================================
# ENDPOINTS
# ==========================================
@app.get("/health", tags=["System"])
async def health_check():
    """Verifica el estado y la disponibilidad de los subsistemas de memoria."""
    return {
        "status": "online",
        "system": "UMA",
        "subsystems": {
            "vector_provider": app_state["vector_provider"],
            "vector_ready": app_state["vector_ready"],
            "vector_detail": app_state["vector_detail"],
            "semantic_graph_nodes": len(app_state["graph_nodes"]),
            "semantic_graph_edges": len(app_state["graph_edges"])
        }
    }

@app.post("/memory/query", response_model=QueryResponse, tags=["Memory Oracle"])
async def query_memory(request: QueryRequest):
    """
    Sogna Hybrid Oracle (GraphRAG) - Version API Residente.
    Ejecuta busqueda vectorial (Fase 1) y expansion de Knowledge Graph (Fase 2) en < 50ms.
    """
    query = request.query
    n_results = request.n_results
    
    # Registrar actividad para retrasar auto-consolidacion
    app_state["last_activity"] = time.time()
    
    logger.info(f"Procesando Oraculo: '{query}'")
    
    vector_matches = []
    found_paths = []
    output_lines = [f"--- SOGNA HYBRID ORACLE (GraphRAG): '{query}' ---", "\n>> [PHASE 1: SEMANTIC RETRIEVAL]"]

    try:
        hits = await asyncio.to_thread(vector_query, query, n_results)
        if hits:
            for hit in hits:
                path_val = hit.get("path", "unknown").replace("\\", "/")
                dist = float(hit.get("distance", 0))
                match_pct = "{:.2%}".format(hit.get("similarity", max(0.0, 1.0 - dist)))
                vector_matches.append(VectorMatch(
                    path=path_val,
                    distance=dist,
                    match_percentage=match_pct
                ))
                found_paths.append(path_val)
                output_lines.append(f" - Found: {path_val} (Match: {match_pct})")
        else:
            output_lines.append(" - No se encontraron resultados vectoriales.")
    except Exception as e:
        logger.error(f"Error en busqueda vectorial: {e}")
        output_lines.append(f" - Error de busqueda vectorial: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    output_lines.append("\n>> [PHASE 2: KNOWLEDGE GRAPH EXPANSION]")
    
    graph_matches = []
    expanded_relations = []
    
    nodes = app_state["graph_nodes"]
    edges = app_state["graph_edges"]
    
    if nodes and edges:
        # Strategy A: Expansion desde resultados vectoriales (Neural -> Symbolic)
        for found_path in found_paths:
            matching_node = next(
                (n for n in nodes if n.get('path', '').replace('\\', '/').endswith(found_path)),
                None
            )
            if matching_node:
                for edge in edges:
                    if edge['source'] == matching_node['id']:
                        target = next((n for n in nodes if n['id'] == edge['target']), None)
                        if target:
                            rel = f" -> [{edge['relation']}] -> {target['label']} ({target['type']})"
                            if rel not in expanded_relations:
                                expanded_relations.append(rel)
                    elif edge['target'] == matching_node['id']:
                        source = next((n for n in nodes if n['id'] == edge['source']), None)
                        if source:
                            rel = f" <- [{edge['relation']}] <- {source['label']} ({source['type']})"
                            if rel not in expanded_relations:
                                expanded_relations.append(rel)
                                
        # Strategy B: Busqueda de etiquetas/descripciones tokenizada (Graph Direct Search)
        query_lower = query.lower()
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'for',
                      'of', 'and', 'or', 'not', 'with', 'by', 'from', 'that', 'this',
                      'el', 'la', 'los', 'las', 'de', 'del', 'en', 'con', 'por', 'para',
                      'un', 'una', 'que', 'es', 'y', 'o', 'no', 'se'}
        tokens = [t for t in query_lower.split() if len(t) >= 3 and t not in stop_words]
        
        label_matches_raw = []
        for n in nodes:
            label_lower = n.get('label', '').lower()
            desc_lower = n.get('description', '').lower()
            id_lower = n.get('id', '').lower()
            
            score = 0
            for token in tokens:
                if token in label_lower:
                    score += 3
                elif token in desc_lower:
                    score += 1
                elif token in id_lower:
                    score += 2
                    
            if score > 0:
                label_matches_raw.append({"node": n, "score": score})
                
        # Boosting por coincidencia exacta
        if query_lower:
            for n in nodes:
                label_lower = n.get('label', '').lower()
                desc_lower = n.get('description', '').lower()
                if query_lower in label_lower or query_lower in desc_lower:
                    existing = next((m for m in label_matches_raw if m["node"]['id'] == n['id']), None)
                    if existing:
                        existing["score"] += 5
                    else:
                        label_matches_raw.append({"node": n, "score": 5})
                        
        label_matches_raw.sort(key=lambda x: x["score"], reverse=True)
        
        for match_info in label_matches_raw[:10]:
            match = match_info["node"]
            score = match_info["score"]
            
            graph_matches.append(GraphMatch(
                id=match.get('id', ''),
                label=match.get('label', ''),
                type=match.get('type', ''),
                description=match.get('description', ''),
                score=score
            ))
            
            for edge in edges:
                if edge['source'] == match['id']:
                    target = next((n for n in nodes if n['id'] == edge['target']), None)
                    if target:
                        rel = f" -> [{edge['relation']}] -> {target['label']} ({target['type']})"
                        if rel not in expanded_relations:
                            expanded_relations.append(rel)
                elif edge['target'] == match['id']:
                    source = next((n for n in nodes if n['id'] == edge['source']), None)
                    if source:
                        rel = f" <- [{edge['relation']}] <- {source['label']} ({source['type']})"
                        if rel not in expanded_relations:
                            expanded_relations.append(rel)
            
            if match.get('path', '') not in found_paths:
                output_lines.append(f" + Graph match (score={score}): {match.get('label','')} ({match.get('type','')}) -- {match.get('description','')}")
                
        if expanded_relations:
            output_lines.append("\n>> [RELATIONS]")
            for rel in expanded_relations[:20]:
                output_lines.append(f" + {rel}")
        elif not label_matches_raw:
            output_lines.append(" + Sin conexiones de grafo adicionales encontradas.")
            
    else:
        output_lines.append(" + Grafo semantico inactivo. Ignorando Fase 2.")
        
    logger.info(f"Oraculo completado: {len(vector_matches)} vectores, {len(graph_matches)} nodos, {len(expanded_relations[:20])} relaciones.")
    return QueryResponse(
        query=query,
        vector_matches=vector_matches,
        graph_matches=graph_matches,
        relations=expanded_relations[:20],
        raw_output="\n".join(output_lines)
    )

@app.post("/memory/system/reload", tags=["System"])
async def reload_graph_endpoint():
    """
    Endpoint administrativo para hacer hot-reload de la Memoria Semantica (Grafo)
    sin reiniciar el proceso del servidor UMA. Ideal post-consolidacion.
    """
    logger.info("Peticion administrativa recibida: Hot-Reload de Knowledge Graph.")
    load_graph()
    return {
        "status": "success",
        "message": "Knowledge Graph recargado satisfactoriamente.",
        "metrics": {
            "nodes": len(app_state["graph_nodes"]),
            "edges": len(app_state["graph_edges"])
        }
    }

@app.post("/memory/consolidate", tags=["System"])
async def consolidate_memory_endpoint():
    """
    Fuerza la ejecucion del pipeline de consolidacion sinaptica (3 fases)
    en segundo plano a traves del modulo consolidate.
    """
    logger.info("Peticion administrativa recibida: Consolidacion Forzada de Memoria.")
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.append(current_dir)
            
        import consolidate
        results = await asyncio.to_thread(consolidate.run_consolidation)
        load_graph()
        return {
            "status": "success",
            "message": "Consolidacion completada satisfactoriamente.",
            "results": results
        }
    except Exception as e:
        logger.error(f"Error en consolidacion forzada: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# CELERY TASK BRIDGE  (A1 — Bridge ↔ Celery)
# ==========================================

class TaskDispatchRequest(BaseModel):
    task_name: str = Field(
        ...,
        description="Nombre de la tarea Celery registrada (memory.reindex, memory.doctor, ollama.generate, script.run, batch.process)."
    )
    args: List[Any] = Field(default_factory=list, description="Argumentos posicionales.")
    kwargs: Dict[str, Any] = Field(default_factory=dict, description="Argumentos clave.")


ALLOWED_CELERY_TASKS: set[str] = {
    "memory.reindex",
    "memory.doctor",
    "ollama.generate",
    "script.run",
    "batch.process",
    # LangGraph state graphs (F0)
    "langgraph.run",
}


def _get_celery_app():
    """Importa la app Celery de forma lazy para no bloquear si Redis no esta disponible."""
    try:
        # Asegurar que la raiz del proyecto esta en sys.path
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        from workers.celery_app import app as celery_app
        return celery_app
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Celery no disponible: {exc}")


@app.post("/tasks/dispatch", tags=["Tasks"])
async def dispatch_task(request: TaskDispatchRequest):
    """
    Despacha una tarea pesada al worker Celery via Redis.
    Devuelve task_id para consultar estado con GET /tasks/status/{task_id}.

    Tareas permitidas:
      - memory.reindex    kwargs: layers (list|None)
      - memory.doctor     sin args
      - ollama.generate   kwargs: prompt (str), model (str), options (dict|None)
      - script.run        kwargs: cmd (list[str]), cwd (str|None)
      - batch.process     kwargs: items (list[dict]), task_name (str), common_opts (dict|None)
      - langgraph.run     kwargs: graph_name (str), kwargs (dict|None)
                            graph_name: uma_consolidation | uma_index
                            kwargs para uma_consolidation: thread_id (str)
                            kwargs para uma_index: layers (list[str]|None), thread_id (str)
    """
    if request.task_name not in ALLOWED_CELERY_TASKS:
        raise HTTPException(
            status_code=400,
            detail=f"Tarea no permitida: {request.task_name}. Permitidas: {sorted(ALLOWED_CELERY_TASKS)}",
        )

    celery_app = await asyncio.to_thread(_get_celery_app)

    try:
        result = await asyncio.to_thread(
            celery_app.send_task,
            request.task_name,
            args=request.args or [],
            kwargs=request.kwargs or {},
        )
        logger.info(f"Tarea Celery despachada: {request.task_name}  id={result.id}")
        return {
            "task_id": result.id,
            "task_name": request.task_name,
            "status": "dispatched",
            "backend": "celery",
        }
    except Exception as exc:
        logger.error(f"Error despachando tarea {request.task_name}: {exc}")
        raise HTTPException(status_code=503, detail=f"Error broker Celery: {exc}")


@app.get("/tasks/status/{task_id}", tags=["Tasks"])
async def get_task_status(task_id: str):
    """
    Consulta el estado y resultado de una tarea Celery por su task_id.
    Estados posibles: PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED.
    """
    celery_app = await asyncio.to_thread(_get_celery_app)

    try:
        result = celery_app.AsyncResult(task_id)
        state = result.state
        info: Dict[str, Any] = {
            "task_id": task_id,
            "state": state,
            "backend": "celery",
        }
        if state == "SUCCESS":
            info["result"] = result.result
        elif state == "FAILURE":
            info["error"] = str(result.result)
            info["traceback"] = result.traceback
        elif state == "STARTED":
            info["meta"] = result.info
        return info
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Error consultando tarea: {exc}")


@app.get("/tasks/list", tags=["Tasks"])
async def list_tasks():
    """
    Lista las ultimas tareas activas e inspeccionables del worker Celery.
    Requiere que el worker este en ejecucion con --events o -E.
    Para tareas recientes sin worker vivo devuelve lista vacia.
    """
    celery_app = await asyncio.to_thread(_get_celery_app)

    try:
        inspect = celery_app.control.inspect(timeout=2.0)
        active = await asyncio.to_thread(lambda: inspect.active() or {})
        reserved = await asyncio.to_thread(lambda: inspect.reserved() or {})

        tasks: list[dict] = []
        for worker_name, job_list in (active or {}).items():
            for t in (job_list or []):
                tasks.append({**t, "queue_state": "active", "worker": worker_name})
        for worker_name, job_list in (reserved or {}).items():
            for t in (job_list or []):
                tasks.append({**t, "queue_state": "reserved", "worker": worker_name})

        return {"tasks": tasks, "count": len(tasks), "backend": "celery"}
    except Exception as exc:
        logger.warning(f"No se pudo listar tareas Celery: {exc}")
        return {"tasks": [], "count": 0, "backend": "celery", "warning": str(exc)}


@app.get("/tasks/health", tags=["Tasks"])
async def tasks_health():
    """
    Verifica conectividad con Redis (broker Celery) y reporta estado del worker.
    """
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        import redis as redis_lib
        client = redis_lib.from_url(redis_url, socket_connect_timeout=2)
        ping = await asyncio.to_thread(client.ping)
        redis_ok = bool(ping)
    except Exception as exc:
        redis_ok = False
        redis_url = f"error: {exc}"

    worker_alive = False
    try:
        celery_app = await asyncio.to_thread(_get_celery_app)
        inspect = celery_app.control.inspect(timeout=2.0)
        stats = await asyncio.to_thread(lambda: inspect.stats())
        worker_alive = bool(stats)
    except Exception:
        pass

    return {
        "redis_ok": redis_ok,
        "redis_url": redis_url.split("@")[-1] if "@" in redis_url else redis_url,
        "worker_alive": worker_alive,
        "status": "ok" if (redis_ok and worker_alive) else ("degraded" if redis_ok else "unavailable"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)

