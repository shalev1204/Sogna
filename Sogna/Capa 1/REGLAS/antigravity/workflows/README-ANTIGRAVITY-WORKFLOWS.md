# Antigravity — Workflows Capa 1 (global)

Documentacion: https://antigravity.google/docs/rules-workflows

## Rutas globales (paridad con skills)

| Tipo | Antigravity IDE (primaria) | Compat |
|------|----------------------------|--------|
| Skills | `~/.gemini/config/skills/` | `~/.gemini/antigravity/skills/` |
| Workflows | `~/.gemini/antigravity-ide/global_workflows/` | `~/.gemini/antigravity/global_workflows/` |

El IDE resuelve workflows con `~/.gemini/{applicationName}/global_workflows/` donde `applicationName` = `antigravity-ide` (ver `product.json` del IDE). **No** usa `config/workflows/` para la UI.

Capa 1 workflows: **solo global**, no en `Desktop/Sogna/.agents/workflows/`.

## Desplegar

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\deploy-antigravity-capa1.ps1"
```

Verificar:

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\verify-capa1-antigravity.ps1"
```

## Tras deploy

1. **Cerrar Antigravity por completo** (no solo la ventana).
2. Reabrir cualquier workspace.
3. Customizations → **Workflows** → pestaña **Global** → deben aparecer 6.
4. En chat: `/` → `/implement`, `/fix-bug`, `/review`, `/explore`, `/refactor`, `/ship`.

## Los 6 workflows

| Nombre UI | Slash | Archivo |
|-----------|-------|---------|
| implement | /implement | implement.md |
| fix-bug | /fix-bug | fix-bug.md |
| review | /review | review.md |
| explore | /explore | explore.md |
| refactor | /refactor | refactor.md |
| ship | /ship | ship.md |

Contenido con frontmatter: `deploy/antigravity/workflows/files/*.md`

## Si la UI Global sigue vacia (bug 1.20.x conocido)

El agente puede recibir workflows por disco aunque la UI no los liste. Compruebe en chat: `/ship`.

Registro manual (una vez por workflow):

1. Customizations → Workflows → **+ Global**
2. **Nombre:** `implement` (sin slash)
3. **Description:** copiar de `DESCRIPTIONS.md`
4. **Command/body:** copiar contenido completo de `files/implement.md`
5. Repetir para los 6.

Atajo — abrir carpeta de copias:

```powershell
explorer "$env:USERPROFILE\.cursor\operator\deploy\antigravity\workflows\files"
```

## Formato archivo

```markdown
---
description: "Texto corto para UI (comillas si hay dos puntos)"
---
# Workflow W1 — ...
(cuerpo SSOT)
```

Limite: **12.000 caracteres** por workflow (con frontmatter).

## SSOT

```
%USERPROFILE%\.cursor\operator\LAYER-1-WORKFLOWS\
```
