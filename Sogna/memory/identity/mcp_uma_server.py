import json
import urllib.request
import urllib.error
from mcp.server.fastmcp import FastMCP
import sys
import os
import logging

# Logging configuration: all output to stderr to protect MCP JSON-RPC channel
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

MEMORY_ROOT = os.path.abspath(os.path.join(current_dir, ".."))

mcp = FastMCP("UMA")


@mcp.tool()
def semantic_recall(query: str) -> str:
    """
    Realiza una busqueda semantica en la memoria UMA de Sognatore.
    Enruta trafico al motor Residente UMA (API en puerto 8080) para latencia nula.
    """
    try:
        url = "http://127.0.0.1:8080/memory/query"
        payload = json.dumps({"query": query, "n_results": 3}).encode('utf-8')
        req = urllib.request.Request(
            url, 
            data=payload, 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            result_data = json.loads(response.read().decode('utf-8'))
            return result_data.get("raw_output", "No output provided by Resident API.")
    except urllib.error.URLError as e:
        return f"Error: No se pudo conectar al Servidor Residente UMA en 8080. Asegurate de que 'start_uma_server.bat' este en ejecucion. Detalle: {e}"
    except Exception as e:
        return f"Error in semantic_recall: {str(e)}"


@mcp.tool()
def fetch_memory_graph() -> str:
    """
    Retorna la estructura completa del Knowledge Graph institucional de Sogna.
    Incluye nodos (entidades), edges (relaciones) y metadatos de validacion.
    """
    try:
        graph_path = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
        if os.path.exists(graph_path):
            with open(graph_path, 'r', encoding='utf-8') as f:
                graph = json.load(f)
            # Return summary + full structure
            meta = graph.get("meta", {})
            summary = (
                f"Graph v{meta.get('version','?')}: "
                f"{meta.get('node_count','?')} nodes, "
                f"{meta.get('edge_count','?')} edges, "
                f"last validated: {meta.get('last_validated','never')}"
            )
            return summary + "\n\n" + json.dumps(graph, ensure_ascii=False, indent=2)
        return "Knowledge Graph not found."
    except Exception as e:
        return f"Error loading graph: {str(e)}"


@mcp.tool()
def get_neural_context(entity_id: str) -> str:
    """
    Obtiene el contexto neural completo de una entidad del Knowledge Graph.
    Devuelve: metadatos del nodo, todas las relaciones entrantes y salientes,
    y estado de validacion del filesystem.
    """
    try:
        graph_path = os.path.join(MEMORY_ROOT, "intelligence", "semantic", "graph.json")
        if not os.path.exists(graph_path):
            return "Knowledge Graph not found."

        with open(graph_path, 'r', encoding='utf-8') as f:
            graph = json.load(f)

        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # Find node by ID or label (case-insensitive)
        query_lower = entity_id.lower()
        target_node = next(
            (n for n in nodes if n["id"].lower() == query_lower or n["label"].lower() == query_lower),
            None
        )

        if not target_node:
            # Fuzzy search by partial label match
            matches = [n for n in nodes if query_lower in n.get("label", "").lower()]
            if matches:
                target_node = matches[0]
            else:
                return f"Entity '{entity_id}' not found in the Knowledge Graph."

        # Gather all relationships
        outgoing = []
        incoming = []
        for edge in edges:
            if edge["source"] == target_node["id"]:
                target = next((n for n in nodes if n["id"] == edge["target"]), None)
                if target:
                    outgoing.append(f"  -> [{edge['relation']}] -> {target['label']} ({target['type']})")
            elif edge["target"] == target_node["id"]:
                source = next((n for n in nodes if n["id"] == edge["source"]), None)
                if source:
                    incoming.append(f"  <- [{edge['relation']}] <- {source['label']} ({source['type']})")

        # Check filesystem validation
        node_path = target_node.get("path", "")
        sogna_root = os.path.abspath(os.path.join(MEMORY_ROOT, ".."))
        if node_path and not node_path.startswith("http"):
            full_path = os.path.join(sogna_root, node_path.replace("/", os.sep))
            fs_status = "EXISTS" if os.path.exists(full_path) else "MISSING"
        else:
            fs_status = "EXTERNAL" if node_path.startswith("http") else "N/A"

        # Build response
        lines = [
            f"=== Neural Context: {target_node['label']} ===",
            f"ID: {target_node['id']}",
            f"Type: {target_node['type']}",
            f"Path: {target_node.get('path', 'N/A')}",
            f"Description: {target_node.get('description', 'N/A')}",
            f"Filesystem: {fs_status}",
            f"Validated: {target_node.get('_validated', 'unknown')}",
            "",
            f"Outgoing Relations ({len(outgoing)}):",
        ]
        lines.extend(outgoing if outgoing else ["  (none)"])
        lines.append(f"\nIncoming Relations ({len(incoming)}):")
        lines.extend(incoming if incoming else ["  (none)"])

        return "\n".join(lines)
    except Exception as e:
        return f"Error getting neural context: {str(e)}"


@mcp.tool()
def query_event_bus(event_type: str = "", severity: str = "", limit: int = 10) -> str:
    """
    Consulta el Event Bus institucional de Sogna.
    Filtra eventos por tipo (prefix match) y/o severidad.
    Devuelve los ultimos N eventos que coincidan.
    """
    try:
        bus_path = os.path.join(MEMORY_ROOT, "intelligence", "events", "bus.json")
        if not os.path.exists(bus_path):
            return "Event Bus not found."

        with open(bus_path, 'r', encoding='utf-8') as f:
            bus = json.load(f)

        events = bus.get("events", [])

        # Apply filters
        if event_type:
            events = [e for e in events if e.get("type", "").startswith(event_type)]
        if severity:
            events = [e for e in events if e.get("data", {}).get("severity", "") == severity]

        # Get last N
        events = events[-limit:]

        if not events:
            return f"No events found matching type='{event_type}', severity='{severity}'."

        lines = [f"Event Bus Query: {len(events)} results (type='{event_type}', severity='{severity}')"]
        for evt in events:
            data = evt.get("data", {})
            lines.append(
                f"\n[{evt.get('time', '?')}] {evt.get('type', '?')} "
                f"(severity={data.get('severity', '?')}) "
                f"source={evt.get('source', '?')}\n"
                f"  {data.get('details', 'N/A')}"
            )

        return "\n".join(lines)
    except Exception as e:
        return f"Error querying event bus: {str(e)}"


@mcp.tool()
def run_consolidation_pipeline() -> str:
    """
    Ejecuta el pipeline de consolidacion sinaptica completo (3 fases).
    Phase 1: Working Memory -> Episodic Memory
    Phase 2: Episodic Memory -> Semantic Memory
    Phase 3: Semantic Memory -> Knowledge Graph validation
    """
    if os.environ.get("SOGNA_MCP_ALLOW_WRITE", "").strip() != "1":
        return (
            "Error: run_consolidation_pipeline requiere SOGNA_MCP_ALLOW_WRITE=1 "
            "(tier L3 — mutacion de memoria)."
        )
    try:
        import consolidate
        results = consolidate.run_consolidation()
        return json.dumps(results, indent=2)
    except Exception as e:
        return f"Error running consolidation pipeline: {str(e)}"


if __name__ == "__main__":
    host = os.environ.get("SOGNA_MCP_HOST", "127.0.0.1").strip() or "127.0.0.1"
    port = int(os.environ.get("SOGNA_MCP_UMA_PORT", "8000"))
    transport = os.environ.get("SOGNA_MCP_UMA_TRANSPORT", "dual").strip().lower() or "dual"

    mcp.settings.host = host
    mcp.settings.port = port
    mcp.settings.streamable_http_path = "/sse"

    if transport in ("sse", "stdio", "streamable-http"):
        mcp.run(transport=transport)  # type: ignore[arg-type]
    else:
        import anyio
        import contextlib
        import uvicorn
        from starlette.applications import Starlette
        from starlette.responses import JSONResponse
        from starlette.routing import Route

        uma_api_port = os.environ.get("SOGNA_UMA_API_PORT", "8080")

        async def health(_request):
            return JSONResponse({"status": "ok", "service": "UMA", "transport": "dual"})

        async def ready(_request):
            uma_ok = False
            try:
                url = f"http://{host}:{uma_api_port}/health"
                with urllib.request.urlopen(url, timeout=3) as response:
                    uma_ok = response.status == 200
            except Exception:
                uma_ok = False
            body = {
                "ready": uma_ok,
                "uma_api": f"{host}:{uma_api_port}",
                "mcp_port": port,
            }
            return JSONResponse(body, status_code=200 if uma_ok else 503)

        async def run_dual_async():
            stream_app = mcp.streamable_http_app()
            sse_app = mcp.sse_app()

            @contextlib.asynccontextmanager
            async def lifespan(_app):
                async with mcp.session_manager.run():
                    yield

            combined = Starlette(
                routes=[
                    Route("/health", endpoint=health, methods=["GET"]),
                    Route("/ready", endpoint=ready, methods=["GET"]),
                    *sse_app.routes,
                    *stream_app.routes,
                ],
                lifespan=lifespan,
            )
            config = uvicorn.Config(
                combined,
                host=host,
                port=port,
                log_level=mcp.settings.log_level.lower(),
            )
            server = uvicorn.Server(config)
            await server.serve()

        logging.info(
            "UMA MCP dual (SSE + Streamable HTTP en /sse) — %s:%s", host, port
        )
        anyio.run(run_dual_async)
