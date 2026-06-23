# Workflow W4 — Explorar codebase

Procedimiento Capa 1 para orientarse en un repositorio desconocido o modulo nuevo antes de W1, W2 o W5. Produce mapa mental accionable: estructura, puntos de entrada, convenciones, comandos verify, respuesta a la pregunta concreta del Operador. Solo lectura salvo mandato explicito. Reglas R2, R8.

## Cuando usar este workflow

| Situacion | W4 | Alternativa |
|-----------|-----|-------------|
| Primer contacto con repo o subcarpeta grande | Si | — |
| Buscar donde vive X antes de tocar codigo | Si | — |
| Como corro tests / build en este proyecto | Si | — |
| Bug con modulo ya conocido | No | W2 directo |
| Implementar con contexto claro en el hilo | No | W1 fase 0 breve |
| Documentar arquitectura formal para wiki | No | technical-docs si pedido |
| Auditoria de seguridad completa | No | review-security + W3 |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Pregunta u objetivo | Si | Donde se valida JWT; como correr tests e2e |
| Profundidad | Opcional | quick / standard / deep |
| Restriccion carpeta | Opcional | Solo packages/api |
| Repo path | Implicito | Workspace actual salvo que indique otro |

Sin pregunta concreta: pedir objetivo. Evitar volcado de arbol sin sintesis accionable.

## Fases ejecutables

| Fase | Objetivo | Acciones | Skill |
|------|----------|----------|-------|
| 1 | Ancla | README, manifest, CI, CONTRIBUTING | explore-codebase |
| 2 | Estructura | Top-level; monorepo vs single app | explore-codebase |
| 3 | Entry points | main, routes, CLI, jobs, exports | explore-codebase |
| 4 | Convenciones | naming, tests, lint, imports | explore-codebase, R2 |
| 5 | Verify | Scripts check/test/build del repo | R3, R8 |
| 6 | Busqueda | grep/semantic hacia pregunta Operador | explore-codebase |
| 7 | Sintesis | Mapa + workflow siguiente sugerido | — |

### Fase 1 — Ancla

Leer README raiz primero. Identificar gestor de paquetes (npm/pnpm/yarn/poetry/cargo/go mod). Anotar version runtime si esta declarada. Si monorepo: identificar herramienta (turbo, nx, lerna, workspaces).

### Fase 2-3 — Estructura y entradas

Mapear carpetas con proposito (src, apps, packages, cmd, internal). Localizar punto de arranque: index.ts, main.go, app.py, server bootstrap. API: routes/, controllers/, handlers/. CLI: bin/, cmd/. Jobs: worker/, cron/, queue/.

### Fase 4 — Convenciones

Inferir de codigo existente, no de preferencia del agente. Anotar patron de errores (throw, Result, error codes). Anotar patron de tests (colocated vs tests/).

### Fase 5 — Verify

Copiar comandos literales de package.json scripts, Makefile, README. Si existen multiples: indicar cual usar para desarrollo diario vs CI.

### Fase 6 — Busqueda dirigida

Responder pregunta del Operador con paths concretos y rol de cada archivo. Trazar flujo en 3-6 pasos si es flujo (request → middleware → handler → db).

### Fase 7 — Sintesis

Entregar plantilla mapa. Recomendar W1, W2, W5 o ninguno segun objetivo siguiente.

## Profundidad

| Nivel | Cobertura | Entrega |
|-------|-----------|---------|
| quick | Ancla + busqueda directa + respuesta | Una seccion corta |
| standard | Fases 1-7 en subarbol relevante | Mapa completo |
| deep | standard + flujo end-to-end trazado | Mapa + diagrama ascii opcional + riesgos |

Default si no se especifica: standard acotado a carpeta relevante para la pregunta.

## Plantilla mapa (fase 7)

```
Proposito del repo (1 frase)
Stack y versiones relevantes
Estructura (arbol resumido, 1-2 niveles utiles)
Puntos de entrada
  Runtime: [path] → rol
  API / CLI: ...
  Tests: comando + ubicacion
Convenciones observadas (naming, errors, tests)
Comandos verify (copiados del repo)
Respuesta a la pregunta del Operador
  Archivos clave: path → rol en una linea
  Flujo (si aplica): paso 1 → 2 → 3
Riesgos / deuda visible (breve, opcional)
Siguiente workflow: W1 | W2 | W5 | ninguno
```

## Tacticas de busqueda (fase 6)

| Pregunta tipo | Donde mirar primero |
|---------------|---------------------|
| Autenticacion | middleware, guards, auth/, passport, jwt |
| Persistencia | models, migrations, prisma, db/, repository |
| Config | .env.example, config/, settings, env schema |
| CI/CD | .github/workflows, .gitlab-ci, Jenkinsfile |
| Feature flags | config, env, launchdarkly, feature/ |
| Logging/tracing | logger, observability, opentelemetry |
| Validacion input | schema, zod, joi, pydantic, dto |

Documentar rutas con path real leido. Marcar incertidumbre si no se encontro.

## Convenciones a anotar (fase 4)

| Aspecto | Fuente tipica |
|---------|---------------|
| Lenguaje y version | package.json engines, .nvmrc, go.mod |
| Test runner | jest.config, vitest, pytest.ini |
| Lint/format | eslint, prettier, ruff, biome |
| Imports | tsconfig paths, alias @/ |
| Commits | CONTRIBUTING, commitlint |
| Branching | README, docs/ |

## Monorepo — notas

| Senal | Accion |
|-------|--------|
| pnpm-workspace.yaml / turbo.json | Listar paquetes principales |
| Paquete interno vs publico | package.json name + exports |
| Dependencias cruzadas | Quien importa a quien (solo si relevante a pregunta) |

No listar todos los paquetes si la pregunta es localizada.

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Repo vacio o solo boilerplate | Informar; pedir objetivo post-setup |
| Multiples apps sin acotar | Listar opciones; pedir carpeta |
| Path inaccesible | Declarar limite; continuar en visible |
| Pregunta requiere ejecutar servicio externo | Documentar prerequisitos; no asumir servicios up |

## Anti-patrones

| Evitar | Por que |
|--------|---------|
| Modificar archivos | W4 es lectura |
| Inventar arquitectura no leida | Viola R2 |
| Dump recursivo de node_modules/dist | Ruido inutil |
| Responder sin paths concretos | No accionable |

## Prohibiciones

- Edicion de codigo sin mandato
- commit/push (R4)
- Cargar SSOT institucional Capa 3 salvo senal explicita del proyecto

## Cadena con otros workflows

```
W4 explore → W1 implement | W2 fix-bug | W5 refactor
```

Exploracion no sustituye plan W1 fase 3 ni reproduccion W2 fase 2. Si la pregunta es solo informativa y no hay trabajo posterior, W4 termina en fase 7 sin workflow siguiente.

## Invocacion

Operador: `/explore` + pregunta u objetivo y profundidad opcional (quick/standard/deep).
