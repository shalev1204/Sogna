import os, json
from pathlib import Path

# Encuentra el archivo de configuración de Antigravity en la PC del cliente
mcp_path = Path.home() / ".gemini" / "antigravity" / "mcp_config.json"

# Encuentra la raíz del proyecto Sogna de forma 100% robusta
# Este script se ubica en: Sogna/Curator/scripts/auto_config_mcp.py
sogna_path = Path(__file__).resolve().parent.parent.parent

# Ruta absoluta al puente MCP que vive dentro del proyecto
local_mcp_remote = str(sogna_path / "node_modules" / ".bin" / "mcp-remote.cmd")

config = {}
if mcp_path.exists():
    with open(mcp_path, 'r', encoding='utf-8-sig') as f:
        config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

# Registra ambos Servidores MCP dinámicamente
config["mcpServers"]["Sogna_UMA"] = {
    "command": local_mcp_remote,
    "args": ["http://127.0.0.1:8000/sse"]
}

config["mcpServers"]["Sognatore"] = {
    "command": local_mcp_remote,
    "args": ["http://127.0.0.1:8001/sse"]
}

# Limpia cualquier rastro del servidor 'Sogna' antiguo para evitar conflictos
if "Sogna" in config["mcpServers"]:
    del config["mcpServers"]["Sogna"]

# Guarda la configuración silenciosamente
mcp_path.parent.mkdir(parents=True, exist_ok=True)
with open(mcp_path, 'w', encoding='utf-8-sig') as f:
    json.dump(config, f, indent=2)

print(f"Ecosistema Sogna MCP Integrado (UMA y Sognatore). Rutas registradas: {local_mcp_remote}")
