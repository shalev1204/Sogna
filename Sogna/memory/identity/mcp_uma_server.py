from mcp.server.fastmcp import FastMCP
import sys
import os
import io
from contextlib import redirect_stdout

# Asegurar que el directorio de identidad esté en el path para la importación
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

import query_uma

# Inicialización del servidor FastMCP
mcp = FastMCP("Sogna UMA")

@mcp.tool()
def semantic_recall(prompt: str) -> str:
    """
    Recupera fragmentos de memoria y conexiones del grafo semántico de Sogna
    invocando el motor query_hybrid de query_uma.py.
    """
    # Captura de la salida estándar del script original para devolverla como resultado de la herramienta
    output_capture = io.StringIO()
    with redirect_stdout(output_capture):
        try:
            query_uma.query_hybrid(prompt)
        except Exception as e:
            print(f"Error operativo en query_hybrid: {str(e)}")
    
    result = output_capture.getvalue()
    return result if result else "No se obtuvieron resultados de la búsqueda híbrida."

if __name__ == "__main__":
    mcp.run()
