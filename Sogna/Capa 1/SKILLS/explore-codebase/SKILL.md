---
name: explore-codebase
description: "Exploracion sistematica de repo desconocido: mapa, entry points, convenciones, verify commands, dependencias internas. Usar al abrir proyecto nuevo, cambiar modulo o paquete, localizar feature config test, antes de plan-before-build sin contexto, o cuando el Operador pida como esta organizado, orientacion, mapa del repo, donde esta X. Anotar Sogna Capa 2 sin cargar Capa 3. Solo lectura salvo peticion contraria. Alineado R8."
---
# Explore codebase

Objetivo: construir mapa operativo del workspace en minutos para que el agente y el Operador compartan modelo mental del proyecto: que es, como arrancar, como verificar, donde vive la logica relevante.

Exploracion = lectura y sintesis. No editar codigo salvo peticion explicita. Alineado con R8 orientacion workspace.

## Disparadores

| Situacion | Objetivo exploracion |
|-----------|---------------------|
| Primer contacto | Mapa global |
| Cambio area | Subarbol backend/frontend/paquete |
| Localizacion | Donde esta feature X, config Y, test Z |
| Pre-planificacion | Contexto antes plan-before-build |
| Post-clone | Setup y comandos verify |
| Operador pregunta | como funciona este repo |

## Principios

1. Mapa 30 segundos antes de profundizar en archivos sueltos.
2. Fuentes de verdad documentales antes de inferir solo por carpetas.
3. Entry points y scripts verify antes de listar todos los archivos.
4. Convenciones del repo > suposiciones del modelo (R2).
5. Sogna: detectar y anotar; no cargar SSOT Capa 3 en skill global.

## Protocolo

### Fase 1 — Mapa rapido

| Dimension | Determinar |
|-----------|------------|
| Tipo | App, libreria, monorepo, polyglot |
| Stack | Lenguajes, frameworks, package manager |
| Raiz trabajo | cwd donde correr check/test |
| Estructura alto nivel | 5-10 carpetas con rol una frase |

### Fase 2 — Fuentes de verdad (orden lectura)

| Prioridad | Artefacto | Extraer |
|-----------|-----------|---------|
| 1 | README.md | Proposito, install, comandos |
| 2 | CLAUDE.md, AGENTS.md, CONTRIBUTING | Reglas, architecture, commands |
| 3 | .cursor/rules, .claude, .agents/rules | alwaysApply, esquina proyecto |
| 4 | package.json, pyproject.toml, go.mod, Cargo.toml | scripts, workspaces |
| 5 | pnpm-workspace.yaml, turbo.json, nx.json | monorepo graph |
| 6 | .github/workflows | CI jobs, comandos reales |
| 7 | Dockerfile, docker-compose | Runtime deploy |

Batch lecturas en paralelo cuando independientes (R transversal).

### Fase 3 — Entry points

| Tipo | Donde buscar |
|------|--------------|
| App server | main.ts, app.py, cmd/ |
| Routes | routes/, app/api/, router |
| CLI | bin/, commander, click |
| Workers | jobs/, consumers/, cron |
| Library public API | index.ts, __init__.py exports |
| Tests | __tests__, tests/, spec |

Scripts npm/Makefile: dev, build, test, check, lint — copiar literales exactos.

### Fase 4 — Dependencias internas

| Monorepo | Accion |
|----------|--------|
| Workspaces | Listar paquetes y dependencias cruzadas |
| Imports | Como paquete A usa B |
| Boundaries | Reglas arquitectura si existen |

| Single repo | Accion |
|-------------|--------|
| Capas | ui / domain / infra si visible |
| Config | env vars documentadas (nombres) |

### Fase 5 — Deteccion Sogna (solo anotar)

| Senal | Peso |
|-------|------|
| Sogna/.sognarc.json | Fuerte |
| Sogna/CLAUDE.md | Fuerte |
| Sogna/memory/identity/sogna.md | Fuerte |
| Sogna/Curator/agents/*.md | Media |
| Sogna/Curator/workflow/ | Media |

Regla: >=1 senal fuerte → Sogna presente; Capa 2 aplica; deferir a esquina (.cursor/rules/sogna-*); codeword Sogna dream = ritual Capa 3; no cargar biblioteca skills masiva aqui.

Si Sogna ausente: una pregunta por sesion si desea instalar (R8); no simular instalacion.

### Fase 6 — Respuesta al Operador

Maximo util en pocas secciones; no dump arbol completo (R7).

## Busqueda dirigida (donde esta X)

| Buscar | Herramienta |
|--------|-------------|
| Simbolo | grep, LSP, semantic search |
| Config key | grep + docs |
| Feature flag | grep feature, env |
| Error string | grep mensaje |
| API route | routes files + OpenAPI |

## Salida obligatoria

```
Resumen (3-5 frases)
Que es / cwd / stack
Estructura clave (tabla ruta | rol)
Entry points
Comandos verify (literales del repo)
Convenciones detectadas
Reglas esquina detectadas
Sogna: presente | ausente | senales
Donde buscar [tema Operador]
Preguntas abiertas
```

## Repo grande

| Estrategia | Cuando |
|------------|--------|
| Subarbol | Operador indico modulo |
| Top-down | Mapa + profundizar solo rama pedida |
| Excluir | node_modules, dist, vendor, .git |

## Integracion

| Skill | Siguiente paso |
|-------|----------------|
| plan-before-build | Implementar tras mapa |
| systematic-debug | Tras localizar modulo fallo |
| technical-docs | Si README roto detectado — mencionar, no arreglar salvo pedido |
| Workflow explore.md | Secuencia formal Capa 1 equivalente |

## Prohibiciones

- Modificar codigo durante exploracion.
- Dump recursivo de arbol sin filtrar.
- Asumir scripts existen sin leer package.json (R2).
- Cargar Capa 3 Sogna completa en respuesta global.
