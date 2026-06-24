# Capa 1 — Verificación 100%

Estructura: **general-rules** (R1–R7 + transversales) + **general-rules-r8** (R8).

SSOT editable:
- `%USERPROFILE%\.cursor\operator\general-rules\general-rules.md`
- `%USERPROFILE%\.cursor\operator\general-rules\general-rules-r8.md`

Regenerar todo: `& "$env:USERPROFILE\.cursor\operator\deploy-capa1.ps1"`

---

## Cursor (User Rules — 2 entradas)

1. Settings → Rules → **User** → **+ Add rule** → nombre: `general-rules`
2. Pegue `deploy\cursor\USER-RULES-general-rules.md` → **Always** (si aplica) → Guardar
3. **+ Add rule** → nombre: `general-rules-r8`
4. Pegue `deploy\cursor\USER-RULES-general-rules-r8.md` → Guardar
5. Reload Window

**Prueba:** chat nuevo → *«¿Qué dice R4?»* y *«¿Qué hace R8 con Sogna dream?»*

---

## Claude Code

Archivos:
- `%USERPROFILE%\.claude\CLAUDE.md` (R1–R8 + indice Capa 1)
- `%USERPROFILE%\.claude\skills\` (13 skills)
- `%USERPROFILE%\.claude\commands\` (6 commands / workflows)

Desplegar todo: `deploy-claude-capa1.ps1`  
Listado oficial: `list-capa1-claude.ps1`  
Verificacion: `verify-capa1-claude.ps1`

Guia: `deploy\claude-code\README.md`

**Prueba:** nueva sesion → `/ship` + *«¿Qué dice R4?»*

---

## Antigravity 2.0 + IDE

**Global** (todos los workspaces):
- `%USERPROFILE%\.gemini\GEMINI.md` → regla 1
- `%USERPROFILE%\.gemini\GEMINI-R8.md` → regla 2

UI: Customizations → Rules → **+ Global** ×2 → pegue `deploy\antigravity\PASTE-GLOBAL-general-rules.md` y `PASTE-GLOBAL-general-rules-r8.md` → **Always On**.

**Workspace Sogna** (opcional refuerzo):
- `Desktop\Sogna\.agents\rules\general-rules.md`
- `Desktop\Sogna\.agents\rules\general-rules-r8.md`

**Prueba:** chat nuevo → R4 + ritual Sogna dream (R8).

---

## Límites Antigravity

Cada archivo ≤ 12.000 caracteres. Tras el split:
- general-rules ≈ 11.285 chars ✓
- general-rules-r8 ≈ 3.938 chars ✓
