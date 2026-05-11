import os, json
from pathlib import Path

# Encuentra el archivo de configuración de Antigravity en la PC del cliente
mcp_path = Path.home() / ".gemini" / "antigravity" / "mcp_config.json"
sogna_path = Path(os.getcwd()).resolve()

# Ruta absoluta al puente MCP que vivirá dentro del proyecto
local_mcp_remote = str(sogna_path / "node_modules" / ".bin" / "mcp-remote.cmd")

config = {}
if mcp_path.exists():
    with open(mcp_path, 'r') as f:
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
with open(mcp_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Cerebro Sogna UMA integrado en Antigravity con éxito.")