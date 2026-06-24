# Capa 1 — Registro portable del Operador global

**Capa 1** = reglas + skills + workflows que aplican a **cualquier proyecto**, en **cualquier equipo**. No es específica de Sogna (eso es Capa 2/3).

Este directorio es la **copia de respaldo y portabilidad** completa. Si cambia de ordenador, clone el repo Sogna y ejecute la instalación desde aquí.

---

## Contenido

| Carpeta | Qué contiene | Cantidad |
|---------|--------------|----------|
| `REGLAS/` | GENERAL RULES R1–R8 + guías de pegado por IDE | 2 reglas + extras |
| `SKILLS/` | Skills globales (una carpeta = un skill) | **13** |
| `WORKFLOWS/` | Workflows globales (commands / slash) | **6** |
| `scripts/` | Instalación y verificación en el nuevo equipo | 2 principales |

---

## Catálogo — Reglas (R1–R8)

| Archivo | Contenido |
|---------|-----------|
| `REGLAS/general-rules.md` | R1–R7 + transversales |
| `REGLAS/general-rules-r8.md` | R8 — orientación workspace y puente Sogna |
| `REGLAS/LAYER-1-RULES-completo.md` | R1–R8 en un solo documento |
| `REGLAS/general-rules-compact-12k.md` | Versión compacta (límite Antigravity 12k) |

### Resumen R1–R8

| Regla | Nombre | Esencia |
|-------|--------|---------|
| R1 | Calidad sobre cantidad | Diff mínimo; no expandir alcance |
| R2 | Leer antes de editar | Evidencia del repo antes de tocar código |
| R3 | Verificar siempre | check/test proporcional al cambio |
| R4 | Git prudente | Sin commit/push sin mandato; no --no-verify |
| R5 | Secretos | No .env, keys, PII en commits |
| R6 | Claridad e idioma | Idioma del Operador; formato citas |
| R7 | Proporcionalidad | Respuesta acorde a la tarea |
| R8 | Orientación workspace | Detectar Sogna; ritual `Sogna dream` |

---

## Catálogo — Skills (13)

| # | Carpeta | Invocación típica |
|---|---------|-------------------|
| G1 | `SKILLS/plan-before-build/` | Plan multi-archivo antes de codificar |
| G2 | `SKILLS/systematic-debug/` | Debug, reproducción, causa raíz |
| G3 | `SKILLS/code-review/` | Revisión pre-merge |
| G4 | `SKILLS/safe-refactor/` | Refactor sin cambiar comportamiento |
| G5 | `SKILLS/api-contract-design/` | APIs, schemas, versionado |
| G6 | `SKILLS/meaningful-tests/` | Tests con valor real |
| G7 | `SKILLS/technical-docs/` | README, ADR, docs técnicas |
| G8 | `SKILLS/git-workflow/` | PR, merge, conflictos |
| G9 | `SKILLS/pragmatic-performance/` | Optimización con métricas |
| G10 | `SKILLS/secure-by-default/` | Seguridad en código |
| G11 | `SKILLS/explore-codebase/` | Mapa de repo desconocido |
| G12 | `SKILLS/commit-prepare/` | Preparar commit con verify |
| G13 | `SKILLS/find-skills/` | Descubrir skills locales o externas |

Cada skill: `SKILLS/<nombre>/SKILL.md` — texto completo listo para leer o desplegar.

---

## Catálogo — Workflows (6)

| ID | Archivo | Slash | Propósito |
|----|---------|-------|-----------|
| W1 | `WORKFLOWS/implement.md` | `/implement` | Feature con plan y gate |
| W2 | `WORKFLOWS/fix-bug.md` | `/fix-bug` | Bug sistemático |
| W3 | `WORKFLOWS/review.md` | `/review` | Revisión pre-merge |
| W4 | `WORKFLOWS/explore.md` | `/explore` | Explorar repo (solo lectura) |
| W5 | `WORKFLOWS/refactor.md` | `/refactor` | Refactor seguro |
| W6 | `WORKFLOWS/ship.md` | `/ship` | Verify, commit, PR |

Cadena SDLC: `explore` → `implement|fix-bug|refactor` → `review` → `ship`

---

## Instalación en un equipo nuevo

### Paso 1 — Automático (reglas disco + skills + workflows)

Desde PowerShell, en la raíz del monorepo Sogna:

```powershell
powershell -ExecutionPolicy Bypass -File "Sogna\Capa 1\scripts\instalar-capa1-completa.ps1"
```

Despliega a:

| Destino | Contenido |
|---------|-----------|
| `~/.gemini/GEMINI.md` + `GEMINI-R8.md` | Reglas Antigravity global |
| `~/.claude/CLAUDE.md` | Reglas Claude Code (compacta) |
| `~/.cursor/skills/` | 13 skills |
| `~/.claude/skills/` | 13 skills |
| `~/.gemini/config/skills/` | 13 skills |
| `~/.cursor/commands/` | 6 workflows |
| `~/.claude/commands/` | 6 workflows |
| `~/.gemini/antigravity-ide/global_workflows/` | 6 workflows (Antigravity IDE) |

### Paso 2 — Manual Cursor (User Rules)

Settings → Rules → User → **+ Add rule** (×2):

1. Nombre `general-rules` → pegar `REGLAS/cursor/USER-RULES-general-rules.md`
2. Nombre `general-rules-r8` → pegar `REGLAS/cursor/USER-RULES-general-rules-r8.md`

Guía: `REGLAS/cursor/EDIT-USER-RULES.md`

### Paso 3 — Manual Antigravity (si la UI no lee disco)

Customizations → Rules → Global (×2): `REGLAS/antigravity/PASTE-GLOBAL-*.md`  
Workflows → Global (×6): ver `REGLAS/antigravity/workflows/DESCRIPTIONS.md`

### Paso 4 — Verificar

```powershell
powershell -File "Sogna\Capa 1\scripts\verificar-capa1.ps1"
```

---

## Dónde vive Capa 1 vs Capa 2

| Capa | Ubicación | Alcance |
|------|-----------|---------|
| **Capa 1** | Este directorio + perfil usuario (`~/.cursor`, `~/.claude`, `~/.gemini`) | Global — cualquier repo |
| **Capa 2** | `Curator/corners/` + esquinas `.cursor/`, `.claude/`, `.agents/` | Proyecto Sogna |
| **Capa 3** | `CLAUDE.md`, `Curator/`, `memory/`, `Sognatore/` | SSOT institucional Sogna |

**Capa 1 no va en el workspace del repo** (salvo esta carpeta de registro/backup).

---

## Sincronizar cambios

1. Edite aquí (`Capa 1/REGLAS`, `SKILLS`, `WORKFLOWS`).
2. Commit en git.
3. En otro equipo: pull + `instalar-capa1-completa.ps1`.

SSOT primario del Operador (máquina de desarrollo): `%USERPROFILE%\.cursor\operator\` — este directorio es **espejo commiteable** para portabilidad.

---

## Límites

- Antigravity: **12.000 caracteres** por regla/workflow en UI; usar `general-rules-compact-12k.md` si hace falta.
- Cursor User Rules: pegado manual (no hay API de deploy).
- Capa 1 **no** incluye Capa 2 ni Capa 3.

Ver también: `CAPA1-VERIFY.md`, `SKILLS/LIMITS.md`, `WORKFLOWS/LIMITS.md`.
