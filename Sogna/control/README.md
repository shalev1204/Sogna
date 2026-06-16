# Panel de control — Sogna

Interfaz reducida para el operador. Los MCP (UMA :8000 y Sognatore :8001) arrancan vía motor cross-platform `control/sogna.mjs`.

## Motor SSOT (Windows y macOS)

| Comando | Uso |
|---------|-----|
| `node control/sogna.mjs on` | Servicios residentes (8080, 8000, 8001, 5173) |
| `node control/sogna.mjs off` | Apaga puertos |
| `node control/sogna.mjs health` | Verifica pila MCP local |
| `pnpm sogna:on` / `pnpm sogna:off` | Atajos desde `Sogna/` |

## Windows

| Archivo | Uso |
|---------|-----|
| **Encender.bat** | Encendido manual |
| **Apagar.bat** | Apagado manual |
| **Sogna.bat** | Delega en `sogna.mjs` |
| **Sogna_App.vbs** | Auto-arranque al iniciar sesión |
| **install_consolidation_task.ps1** | Consolidación UMA diaria 03:00 (Task Scheduler) |

## macOS

| Archivo | Uso |
|---------|-----|
| **Encender.sh** | Encendido manual |
| **Apagar.sh** | Apagado manual |
| **sogna.sh** | Delega en `sogna.mjs` |
| **macos/install_launchd.sh** | Arranque al login + consolidación 03:00 (launchd) |
| **macos/uninstall_launchd.sh** | Elimina agentes launchd |

```bash
cd Sogna/control/macos
chmod +x install_launchd.sh uninstall_launchd.sh
./install_launchd.sh
```

Tras clonar en Mac: `pnpm install`, `pnpm mcp:config`, `./Encender.sh` o launchd.

## Puertos

| Puerto | Servicio |
|--------|----------|
| 8080 | API UMA |
| 8000 | MCP UMA |
| 8001 | MCP Bridge + dashboard |
| 5173 | Sogna Web (Vite) |

## Logs

- `memory/operational/logs/resident.log` — API UMA
- `memory/operational/logs/mcp_uma.log` — MCP UMA
- `memory/operational/logs/mcp_bridge.log` — Bridge
- `memory/operational/logs/consolidation_scheduler.log` — pipeline programado
- `memory/operational/logs/launchd_*.log` — macOS launchd
