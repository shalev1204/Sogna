# Capa 2 — SSOT esquinas Sogna (Curator/corners)

Plantillas de **puente Capa 2** por IDE. Viajan con la carpeta `Sogna/` en cualquier host repo.

## Contenido

| IDE | Archivos SSOT | Destino desplegado |
|-----|---------------|-------------------|
| Cursor | `cursor/sogna-bridge.mdc`, `cursor/sogna-ecosystem.mdc` | `.cursor/rules/` |
| Claude Code | `claude/sogna-bridge.md`, `claude/sogna-ecosystem.md`, `claude/CLAUDE.index.host.md` | `.claude/` + `CLAUDE.md` (host embedded) |
| Antigravity | `antigravity/sogna-bridge.md`, `antigravity/sogna-ecosystem.md` | `.agents/rules/` |

| Recurso | SSOT | Destino desplegado |
|---------|------|-------------------|
| Git | `ignores/gitignore.host` o `gitignore.monorepo` | `.gitignore` |
| Git attrs | `ignores/gitattributes` | `.gitattributes` |
| ripgrep | `ignores/rgignore.host` o `rgignore.monorepo` | `.rgignore` |
| Indexado IA | `ignores/ai-index.host` o `ai-index.monorepo` | `.cursorignore`, `.claudeignore` |
| Exclusiones Antigravity | `antigravity/sogna-index-exclusions.md` | `.agents/rules/sogna-index-exclusions.md` |

Contrato machine-readable: `../../platform.manifest.json` (raíz del monorepo `Sogna/`).

## Regla de edición

**Edite solo aquí** (`Curator/corners/`). No modifique copias desplegadas sin actualizar el SSOT.

**Sincronía obligatoria Capa 2:** cualquier cambio en esquinas o ignores debe aplicarse en **las tres plataformas IDE** + git/rg antes de desplegar:

| Plataforma | Esquinas SSOT | Indexado / exclusiones |
|------------|---------------|------------------------|
| Cursor | `corners/cursor/` | `.cursorignore` (nativo) |
| Claude Code | `corners/claude/` | `.claudeignore` (nativo) |
| Antigravity | `corners/antigravity/` | `.agents/rules/sogna-index-exclusions.md` (regla; **no** existe `.antigravityignore` nativo) |

Git (`.gitignore`, `.gitattributes`) y búsqueda (`.rgignore`) viven en `corners/ignores/`. Layout **host** (repo con subcarpeta `Sogna/`) vs **monorepo** (raíz git = `Sogna/`).

Tras editar SSOT, ejecute `scripts/deploy-corners.ps1` (monorepo + host embedded si aplica). Verifique con `scripts/verify-corners.ps1`.

**Codificacion:** no embeber texto UTF-8 en scripts `.ps1` (PowerShell 5.x corrompe em-dash y acentos). Todo contenido desplegable vive en SSOT bajo `corners/` o `corners/ignores/` y se copia con `Copy-Verify` (bytes identicos).

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
