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

# Registra Sogna UMA dinámicamente con rutas absolutas
config["mcpServers"]["Sogna_UMA"] = {
    "command": local_mcp_remote,
    "args": ["http://127.0.0.1:8000/sse"]
}

# Guarda la configuración silenciosamente
mcp_path.parent.mkdir(parents=True, exist_ok=True)
with open(mcp_path, 'w', encoding='utf-8-sig') as f:
    json.dump(config, f, indent=2)

print(f"Cerebro Sogna UMA integrado en Antigravity con éxito. Ruta registrada: {local_mcp_remote}")
