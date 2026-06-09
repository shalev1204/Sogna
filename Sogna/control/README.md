# Panel de control — Sogna

Interfaz reducida para el operador. Los MCP (UMA :8000 y Sognatore :8001) están pensados para **arranque y parada automáticos** vía `Sogna_App.vbs` y el registro de Windows; los botones manuales son **reserva** ante fallos o reinicios.

## En esta carpeta (solo lo esencial)

| Archivo | Uso |
|---------|-----|
| **Encender.bat** | Encendido manual — servicios en segundo plano |
| **Apagar.bat** | Apagado manual — libera 8080, 8000, 8001 |
| **Sogna.bat** | Motor interno (no hace falta abrirlo a mano) |
| **Sogna_App.vbs** | Auto-arranque al iniciar sesión en Windows |
| **dashboard/** | Panel web (`http://127.0.0.1:8001/dashboard/`) |
| **docs/** | Pulse, portal, guías |

Línea de comandos (desde `Sogna\control\`): `Sogna.bat on`, `Sogna.bat off`, `Sogna.bat check`, `Sogna.bat sync`.

## Consolidación UMA (Task Scheduler)

Pipeline episódico → semántico cada **24 horas** vía `memory/identity/consolidate.py`.

| Archivo | Uso |
|---------|-----|
| **consolidate_scheduled.bat** | Wrapper con log (invocado por la tarea) |
| **install_consolidation_task.ps1** | Registra `Sogna Memory Consolidation` (diaria 03:00) |
| **uninstall_consolidation_task.ps1** | Elimina la tarea programada |

```powershell
cd Sogna\control
.\install_consolidation_task.ps1    # registrar
.\uninstall_consolidation_task.ps1  # eliminar
```

Log dedicado: `memory/operational/logs/consolidation_scheduler.log`

## Puertos

| Puerto | Servicio |
|--------|----------|
| 8080 | API UMA |
| 8000 | MCP UMA |
| 8001 | MCP Bridge + dashboard |

## Logs

- `memory/operational/logs/resident.log` — arranques UMA / watcher  
- `memory/operational/logs/mcp_bridge.log` — Bridge  
- `memory/operational/logs/consolidation_scheduler.log` — pipeline UMA programado  
- `memory/operational/logs/diagnostics/` — salida de `sogna check`

## Depuración

`sogna up` — Bridge en primer plano (consola bloqueante, solo desarrollo).
