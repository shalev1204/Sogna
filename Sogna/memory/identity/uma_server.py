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

import chromadb
from chromadb.utils import embedding_functions

# Configuración Profesional de Logging Institucional
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SOGNA-UMA] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("UMA-Server")

# Resolucion Absoluta de Rutas del Ecosistema Sogna
MEMORY_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GRAPH_PATH = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
CHROMA_DB_PATH = os.path.join(MEMORY_ROOT, "operational", "vectors", "chroma")

# Estado Global Residente (Warm State)
app_state = {
    "chroma_client": None,
    "collection": None,
    "graph_nodes": [],
    "graph_edges": [],
    "last_activity": time.time(),
    "consolidation_task": None
}

IDLE_THRESHOLD_SECONDS = 300  # 5 minutos

async def idle_consolidation_worker():
    """Worker en segundo plano que consolida la memoria si el sistema esta inactivo."""
    while True:
        await asyncio.sleep(60)  # Chequea cada minuto
        if app_state["chroma_client"] is None:
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
    
    # 1. Cargar Base de Datos Vectorial (ChromaDB)
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        collection = client.get_or_create_collection(name="uma_core", embedding_function=emb_fn)
        app_state["chroma_client"] = client
        app_state["collection"] = collection
        logger.info(f"ChromaDB Conectado. Coleccion 'uma_core' cargada en estado WARM.")
    except Exception as e:
        logger.error(f"Fallo de inicializacion vectorial (ChromaDB): {e}")

    # 2. Cargar Memoria Semantica (Grafo JSON)
    load_graph()
    
    # 3. Iniciar el demonio de auto-consolidacion
    app_state["consolidation_task"] = asyncio.create_task(idle_consolidation_worker())
    
    logger.info("API Residente UMA en linea y operando.")
    yield
    
    # Shutdown
    logger.info("Iniciando apagado seguro de la Memoria UMA...")
    if app_state.get("consolidation_task"):
        app_state["consolidation_task"].cancel()
    
    app_state["chroma_client"] = None
    app_state["collection"] = None
    logger.info("Recursos de memoria liberados. Apagado completado.")

# Inicializacion de FastAPI con Metadata Institucional
app = FastAPI(
    title="UMA Resident Memory API",
    description="API de alto rendimiento en estado WARM para la Arquitectura de Memoria Unificada de Sogna.",
    version="2.0.0",
    lifespan=lifespan
)

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
    n_results: int = Field(default=3, description="Numero de resultados top-k a extraer de ChromaDB.", ge=1, le=20)

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
            "chromadb_loaded": app_state["collection"] is not None,
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
    
    collection = app_state["collection"]
    if collection:
        try:
            results = collection.query(query_texts=[query], n_results=n_results)
            if results['documents'] and len(results['documents'][0]) > 0:
                for i in range(len(results['documents'][0])):
                    meta = results['metadatas'][0][i] if results['metadatas'] else {}
                    path_val = meta.get('path', 'unknown').replace('\\', '/')
                    dist = results['distances'][0][i]
                    match_pct = "{:.2%}".format(1 - dist)
                    
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
    else:
        output_lines.append(" - Busqueda vectorial inactiva (Chroma offline).")
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)

