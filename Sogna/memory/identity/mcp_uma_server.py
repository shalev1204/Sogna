import json
from mcp.server.fastmcp import prompts
from mcp.server.fastmcp import FastMCP
import sys
import os
import logging

# Configuración obligatoria de logging para que todo vaya a sys.stderr
# Esto evita corromper el canal stdout usado por el protocolo JSON-RPC de MCP
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

# Asegurar que el directorio de identidad esté en el path para la importación
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Importar query_uma después de configurar logging
import query_uma

# Inicialización del servidor FastMCP
mcp = FastMCP("Sogna_UMA")

@mcp.tool()
def semantic_recall(query: str) -> str:
    """
    Realiza una búsqueda semántica en la memoria UMA de Sognatore.
    """
    try:
        result = query_uma.query_hybrid(query)
        
        if result:
            return json.dumps(result, ensure_ascii=False, indent=2)
        else:
            return "No se obtuvieron resultados de la búsqueda híbrida."
            
    except Exception as e:
        error_msg = f"Error operativo en query_hybrid: {str(e)}"
        print(error_msg, file=sys.stderr)
        return error_msg

if __name__ == "__main__":
    # Arrancamos el servidor en modo SSE (el puerto 8000 se asignará por defecto)
    mcp.run(transport='sse')
