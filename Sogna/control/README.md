# Panel de control — Sogna

Interfaz reducida para el operador. Los MCP (UMA y Sognatore) arrancan vía motor cross-platform `control/sogna.mjs`. Puertos SSOT: `platform.manifest.json` → `local_services`.

## Ritual MCP (recomendado)

```bash
cd Sogna
git pull                    # manual — antes del bootstrap
pnpm sogna:dream            # bootstrap máquina (deps, corners, env, MCP, catálogo)
pnpm mcp:doctor             # atajo si solo necesita validar MCP
```

Informe JSON: `memory/operational/logs/dream_latest.json`. Flags: `--fast`, `--full`, `--fetch`, `--start-services`, `--deploy-corners`.

Tras `sogna:dream` OK: reinicie los servidores **UMA** y **Sognatore** en Cursor (Settings → MCP) si cambió `mcp:config`.

| Comando | Uso |
|---------|-----|
| `pnpm mcp:doctor` | Config + contrato + registro Cursor + health + initialize |
| `pnpm mcp:contract` | Paridad mcp.contract.json ↔ código fuente |
| `pnpm mcp:health` | Solo runtime (API, Bridge /health|/ready|/metrics, SSE + initialize) |
| `pnpm mcp:handshake` | P4: handshake + tools/list vs contrato |
| `pnpm mcp:observability` | P3: rutas /metrics, /mcp-stack, dashboard, guards |
| `pnpm mcp:config` | Solo sincronizar `.cursor/mcp.json`, Claude, Antigravity |

## Motor SSOT (Windows y macOS)

| Comando | Uso |
|---------|-----|
| `node control/sogna.mjs on` | Servicios residentes (8080, 8000, 8001, 5173 por defecto) |
| `node control/sogna.mjs off` | Apaga puertos |
| `node control/sogna.mjs health` | `verify-mcp-health.mjs` (handshake MCP) |
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

## Puertos (defaults — override vía `local_services` o env)

| Puerto | Servicio | Variable env |
|--------|----------|----------------|
| 8080 | API UMA | `SOGNA_UMA_API_PORT` |
| 8000 | UMA MCP | `SOGNA_MCP_UMA_PORT` |
| 8001 | MCP Sognatore Bridge + dashboard | `SOGNA_MCP_BRIDGE_PORT` |
| 5173 | Sogna Web (Vite) | `SOGNA_WEB_PORT` |

Host loopback: `SOGNA_MCP_HOST` (default `127.0.0.1`). El Bridge y UMA MCP solo escuchan en ese host.

**Seguridad local (opt-in):** `SOGNA_MCP_ALLOW_WRITE=1` habilita tools L2/L3 vía MCP. `SOGNA_DELEGATE_API_TOKEN` protege REST `/api/*` del Bridge. `SOGNA_MCP_TOKEN` protege transporte MCP del Bridge (`?token=` en URL Sognatore vía `mcp:config`).

**P4 — Contrato runtime:** `pnpm mcp:handshake` — initialize + `tools/list` vs `mcp.contract.json`. Timeouts por tier en Bridge (`SOGNA_MCP_TIMEOUT_L0_MS` … `L3`).

**Watchdog Bridge:** tras `sogna:on`, si `/health` falla 3 veces (60s entre chequeos), reinicia el proceso en :8001. Ajuste: `SOGNA_BRIDGE_WATCHDOG_MS`, `SOGNA_BRIDGE_WATCHDOG_FAILURES`.

**Watchdog UMA MCP:** tras `sogna:on`, si `:8000/health` falla 3 veces, reinicia `mcp_uma_server.py`. Ajuste: `SOGNA_MCP_UMA_WATCHDOG_MS`, `SOGNA_MCP_UMA_WATCHDOG_FAILURES`.

**UMA dual transport (P6):** SSE GET `/sse` + Streamable HTTP POST `/sse` en el mismo puerto; `/health` y `/ready` (depende de UMA API :8080).

**CI:** `pnpm mcp:ci` — `mcp-doctor` (modo CI) + build Bridge + amplifier + observability estática (sin stack local).

**Observabilidad (P3):** `GET /metrics` y `GET /mcp-stack` en Bridge; panel MCP en `:8001/dashboard/`. Logs JSON: `SOGNA_MCP_JSON_LOGS=1`. Config portable/CI: `SOGNA_MCP_PORTABLE=1` o `CI=true` en `mcp:config`.

## Logs

- `memory/operational/logs/resident.log` — API UMA
- `memory/operational/logs/mcp_uma.log` — UMA MCP
- `memory/operational/logs/mcp_bridge.log` — Bridge
- `memory/operational/logs/consolidation_scheduler.log` — pipeline programado
- `memory/operational/logs/launchd_*.log` — macOS launchd
