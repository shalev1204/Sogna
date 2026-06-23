---
name: find-skills
description: "Descubre skills locales Capa 1 y del proyecto antes de buscar en skills.sh. Usar cuando el Operador pregunte como hago X, hay skill para X, buscar skill, instalar skill, ampliar capacidades, o quiera skills de terceros. Prioridad: 12 skills globales del Operador, nativas Cursor, proyecto, luego npx skills find."
---
# Find skills

Objetivo: conectar necesidad del Operador con la skill correcta. Priorizar catalogo local instalado antes del ecosistema externo skills.sh.

## Orden de busqueda (obligatorio)

| Prioridad | Donde | Accion |
|-----------|-------|--------|
| 1 | Capa 1 global Operador | Invocar skill local si aplica (tabla abajo) |
| 2 | Nativas Cursor | create-rule, create-skill, review-bugbot, review-security, split-to-prs, canvas, sdk |
| 3 | Proyecto | .cursor/skills/, Sogna/Curator/skills/ si workspace Sogna |
| 4 | Externo | npx skills find, https://skills.sh/ |

No recomendar skill externa si ya existe equivalente local.

## Catalogo Capa 1 (global Operador)

| Skill | Cuando invocar |
|-------|----------------|
| plan-before-build | Tarea ambigua, multi-archivo, arquitectura, pedir plan |
| systematic-debug | Tests rojos, errores, regresiones, no funciona |
| code-review | Revisar diff, pre-merge, pre-PR |
| safe-refactor | Refactor sin cambiar comportamiento |
| api-contract-design | Endpoints, MCP, SDK, schemas, versionado |
| meaningful-tests | Que testear, CI rojo, regresion, TDD |
| technical-docs | README, ADR, documentar API |
| git-workflow | PR, conflictos, merge/rebase, mensaje commit |
| pragmatic-performance | Lentitud, timeouts, N+1, optimizar con metricas |
| secure-by-default | Auth, input, secretos, CVE, security review ligero |
| explore-codebase | Repo nuevo, mapa, donde esta X |
| commit-prepare | Prepara commit, diff listo, verify previo |

Rutas skills: ~/.cursor/skills/, ~/.claude/skills/, ~/.gemini/config/skills/

## Workflows Capa 1 (NO son skills)

Los workflows W1-W6 son **slash commands** (macros procedimentales), no skills. No listarlos como "Workflow Skills" ni mezclarlos con el catalogo de skills.

| ID | Comando | Cuando usar |
|----|---------|-------------|
| W1 | /implement | Feature nueva con plan y gate |
| W2 | /fix-bug | Bug, test rojo, reproduccion |
| W3 | /review | Revision pre-merge o pre-PR |
| W4 | /explore | Repo desconocido, donde esta X |
| W5 | /refactor | Refactor sin cambiar comportamiento |
| W6 | /ship | Verify, commit, PR (solo con mandato) |

Rutas commands: ~/.cursor/commands/, ~/.claude/commands/, ~/.gemini/config/workflows/, ~/.gemini/antigravity/global_workflows/

Si el Operador pide "skills list" o catalogo completo: mostrar **13 skills** (tabla arriba + find-skills) y **6 workflows** (tabla commands) en secciones separadas.

## Disparadores find-skills

- como hago X / hay skill para X / busca skill / instala skill
- ampliar capacidades / herramienta especializada
- dominio sin skill local obvia (design system externo, deploy cloud especifico)

## Ecosistema externo (solo si paso 1-3 no bastan)

CLI: npx skills

| Comando | Uso |
|---------|-----|
| npx skills find [query] | Buscar por keyword |
| npx skills add package@skill -g -y | Instalar global |
| npx skills check / update | Mantenimiento |

Browse: https://skills.sh/

### Calidad antes de recomendar externo

| Criterio | Umbral orientativo |
|----------|-------------------|
| Installs | Preferir 1K+; cautela <100 |
| Fuente | vercel-labs, anthropics, microsoft > desconocido |
| Duplicado | No instalar si Capa 1 ya cubre |

### Instalacion externa

```bash
npx skills add owner/repo@skill-name -g -y
```

## Si no hay skill

1. Decir que no hay match local ni externo fiable.
2. Ofrecer ayuda directa con skills Capa 1 aplicables.
3. Sugerir crear skill propia: npx skills init nombre-skill o create-skill (nativa Cursor).

## Salida al Operador

```
Necesidad interpretada
Skill local recomendada (si aplica) + como invocar
Alternativa externa (solo si procede) + comando install
Siguiente paso
```

## Prohibiciones

- Saltar catalogo local e ir directo a skills.sh.
- Instalar externa duplicando code-review, debug, git-workflow locales.
- Recomendar skill externa sin verificar installs/fuente.
- Listar slash commands (implement, fix-bug, etc.) como si fueran skills.
