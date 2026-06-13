# Capa 2 — SSOT esquinas Sogna (Curator/corners)

Plantillas de **puente Capa 2** por IDE. Viajan con la carpeta `Sogna/` en cualquier host repo.

## Contenido

| IDE | Archivos SSOT | Destino desplegado |
|-----|---------------|-------------------|
| Cursor | `cursor/sogna-bridge.mdc`, `cursor/sogna-ecosystem.mdc` | `.cursor/rules/` |
| Claude Code | `claude/sogna-bridge.md`, `claude/sogna-ecosystem.md` | `.claude/` |
| Antigravity | `antigravity/sogna-bridge.md`, `antigravity/sogna-ecosystem.md` | `.agents/rules/` |

Contrato machine-readable: `../../platform.manifest.json` (raíz del monorepo `Sogna/`).

## Regla de edición

**Edite solo aquí** (`Curator/corners/`). No modifique copias en `.cursor/`, `.claude/`, `.agents/` sin actualizar este SSOT.

## Desplegar (repo actual)

Desde la raíz del monorepo `Sogna/`:

```powershell
powershell -File scripts/deploy-corners.ps1
```

Verificar:

```powershell
powershell -File scripts/verify-corners.ps1
```

## Instalar en otro host repo

Requisito: el host tiene carpeta `Sogna/` con `Curator/corners/` y `platform.manifest.json`.

Desde la **raíz git del host**:

```powershell
powershell -File Sogna/scripts/install-corners-host.ps1
```

## Precedencia

Capa 3 (`CLAUDE.md`, memory, `Curator/rules`, agentes…) > Capa 2 (esquinas desplegadas) > Capa 1 (Operador global).

## Prohibido en esquinas

- Duplicar R1–R8 (Capa 1)
- Duplicar skills/workflows Capa 1 o Capa 3
- Sustituir manual Capa 3
