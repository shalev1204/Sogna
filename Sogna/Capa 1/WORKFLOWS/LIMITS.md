# Capa 1 Workflows — Limites por plataforma (junio 2026)

Investigacion para 6 workflows globales Capa 1 (W1-W6).

## Resumen ejecutivo

| Plataforma | Mecanismo | Ruta global | Limite critico |
|------------|-----------|-------------|----------------|
| Cursor | Slash commands | `~/.cursor/commands/*.md` | Sin limite duro documentado; cuerpo markdown plano |
| Cursor (alternativa) | Subagents | `~/.cursor/agents/*.md` | Contexto aislado; no usar para W1-W6 (procedimientos, no agentes) |
| Claude Code | Slash commands | `~/.claude/commands/*.md` | Sin limite duro; plain markdown |
| Claude Code (alternativa) | Workflows dinamicos JS | `~/.claude/workflows/` | Orchestracion ultracode; fuera Capa 1 |
| Antigravity | Workflows UI + `/` | Global `~/.gemini/config/workflows/` + `~/.gemini/antigravity/global_workflows/` | **12.000 caracteres** por workflow |

## Cursor — slash commands (recomendado Capa 1)

Documentacion: cursor.com/docs (commands en `.cursor/commands/`).

| Aspecto | Detalle |
|---------|---------|
| Formato | Markdown plano, **sin frontmatter** |
| Nombre | Nombre archivo = comando slash (`implement.md` → `/implement`) |
| Alcance global | `~/.cursor/commands/` |
| Alcance proyecto | `.cursor/commands/` |
| Invocacion | Operador escribe `/implement` en chat |
| vs Skills | Skills = invocacion por descripcion; commands = invocacion explicita usuario |
| vs Subagents | Subagents = contexto aislado; workflows Capa 1 = secuencia en hilo principal |

Regla: W1-W6 son **commands**, no subagents.

## Claude Code — slash commands

| Aspecto | Detalle |
|---------|---------|
| Formato | Markdown plano en `~/.claude/commands/` |
| Invocacion | `/implement`, `/fix-bug`, `/refactor`, `/ship`, etc. |
| Relacion skills | Un command orquesta skills Capa 1 ya instaladas |
| Workflows dinamicos | `~/.claude/workflows/*.js` — no duplicar Capa 1 salvo necesidad futura |

## Antigravity — workflows

Documentacion: antigravity.google/docs/rules-workflows, antigravity.google/docs/skills

| Aspecto | Detalle |
|---------|---------|
| UI | Customizations → Workflows → +Global o +Workspace |
| Invocacion | `/` en chat; nombre sin mayusculas ni caracteres especiales raros |
| Campos UI | Nombre, descripcion corta, cuerpo comando |
| Limite | **12.000 caracteres** en cuerpo (igual que Rules GEMINI.md) |
| Workspace disco | **NO** Capa 1 — `.agents/workflows/` es Capa 3 Sogna si aplica |
| Global disco | `~/.gemini/config/workflows/` + `~/.gemini/antigravity/global_workflows/` |
| YAML | Evitar `:` sin comillas en metadata si Antigravity parsea frontmatter |

Leccion skills: cuerpos con YAML roto = ignorados silenciosamente. Workflows Antigravity = texto plano; no depender de frontmatter.

## Diseno Capa 1 (6 workflows)

| ID | Archivo | Slash | Duracion tipica |
|----|---------|-------|-----------------|
| W1 | implement.md | /implement | 1 sesion |
| W2 | fix-bug.md | /fix-bug | 30 min – 2 h |
| W3 | review.md | /review | 15–45 min |
| W4 | explore.md | /explore | Inicio proyecto / pregunta puntual |
| W5 | refactor.md | /refactor | 30 min – 2 h |
| W6 | ship.md | /ship | 10–30 min |

Target tamano cuerpo: **6000–9500 caracteres** cada uno (margen bajo 12k Antigravity). Version v2 expandida junio 2026.

Contrato interno (todos):

1. Entrada — que necesita el Operador
2. Fases — secuencia numerada verificable
3. Salida — artefacto concreto
4. Verificacion — comando o criterio hecho
5. Stop conditions — cuando parar y preguntar
6. Skills Capa 1 — referencias explicitas (orquestacion, no duplicacion)

## Dos esquemas de despliegue

```
~/.cursor/commands/<name>.md               # Cursor global
~/.claude/commands/<name>.md               # Claude Code global
~/.gemini/config/workflows/<name>.md               # Antigravity IDE (paridad skills)
~/.gemini/antigravity/global_workflows/<name>.md     # Antigravity compat / docs
# Workspace Sogna: NO desplegar Capa 1 workflows aqui
```

SSOT: `%USERPROFILE%\.cursor\operator\LAYER-1-WORKFLOWS\<name>.md`

Antigravity UI: pegar cuerpo SSOT + descripcion de `deploy/antigravity/workflows/DESCRIPTIONS.md`

## Workflows vs Skills Capa 1

| Workflows W1-W6 | Skills G1-G12 |
|-----------------|---------------|
| Invocados por `/` (macro procedimental) | Invocados por contexto o nombre |
| Orquestan fases completas de sesion | Dominio unico reusable |
| Referencian skills dentro del flujo | Ejecutan protocolo del dominio |

Ejemplos: W1 → plan-before-build; W2 → systematic-debug; W5 → safe-refactor; W6 → commit-prepare + git-workflow.

## No confundir con Capa 3

`Sogna/Curator/workflow/` = workflows institucionales Sogna (RARV, dept). Capa 1 W1-W6 = universales, sin UMA/Sentinel.
