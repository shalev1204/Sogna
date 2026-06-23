---
name: api-contract-design
description: "Diseno de contratos API: tipos, validacion, errores, auth, paginacion, versionado y compatibilidad. Usar al crear o cambiar endpoints REST/GraphQL, RPC, eventos, webhooks, MCP tools, SDK publicos, OpenAPI/JSON Schema, fronteras entre servicios o modulos exportados. Coordinar con secure-by-default en auth y plan-before-build en contratos multi-equipo. Tests de contrato happy path y validacion obligatorios en el plan de implementacion."
---
# API contract design

Objetivo: definir interfaz explicita, estable para consumidores y evolutiva para productores. El contrato precede o acompana la implementacion; nunca queda implicito en el codigo sin schema o tipos compartidos.

Contrato publico: cualquier superficie invocable desde fuera del modulo o servicio (HTTP, export TS, protobuf, MCP tool descriptor, CLI flag publico).

## Disparadores

| Situacion | Ejemplos |
|-----------|----------|
| Superficie nueva | POST /users, query GraphQL, tool MCP |
| Cambio breaking | Renombrar campo, cambiar tipo, eliminar endpoint |
| SDK / libreria | Metodos exportados para terceros |
| Integracion | Webhook, cola, evento de dominio |
| Frontera interna estable | Paquete monorepo consumido por otros paquetes |

## Principios

1. Schema-first o types-first segun stack (OpenAPI, Zod, Pydantic, protobuf).
2. Validacion en el borde: rechazar input invalido antes de logica de negocio.
3. Errores predecibles: codigos estables, cuerpo parseable, sin filtrar stack interno.
4. Evolucion aditiva por defecto; breaking changes versionados y documentados.
5. Seguridad en diseno: authZ por operacion, rate limits en diseno (secure-by-default).

## Protocolo

### Fase 1 — Consumidor y operacion

| Pregunta | Documentar en salida |
|----------|---------------------|
| Quien consume | Browser, mobile, servicio, agente MCP |
| Operaciones | CRUD, acciones, idempotencia (PUT, Idempotency-Key) |
| SLA | Latencia esperada, timeout, paginacion obligatoria |
| Volumen | Rate limit, tamano max payload |

### Fase 2 — Modelo request/response

| Elemento | Reglas |
|----------|--------|
| Campos requeridos | Minimo necesario; defaults explicitos |
| Tipos | string, number, enum cerrado; fechas ISO 8601 |
| Null vs omitido | Politica consistente en todo el API |
| Response exito | DTO; no entidad DB cruda |
| Metadata | paginacion cursor/offset, total, links next/prev |
| Errores | Misma forma en todos los endpoints del servicio |

### Fase 3 — Autenticacion y autorizacion

| Capa | Diseno |
|------|--------|
| AuthN | Bearer, cookie, API key, mTLS segun contexto |
| AuthZ | Permiso por recurso y operacion; default deny |
| Scopes | Documentados en contrato si OAuth |
| Errores auth | 401 vs 403 semantica correcta |

### Fase 4 — Codigos de error

| HTTP | Uso | Cuerpo |
|------|-----|--------|
| 400 | JSON mal formado, validacion campo | code estable + fields{} |
| 401 | No autenticado | Generico |
| 403 | No autorizado | Sin filtrar existencia si policy ocultacion |
| 404 | Recurso inexistente | Consistente con 403 |
| 409 | Conflicto estado, duplicate | retry_after opcional |
| 422 | Regla negocio | code app estable |
| 429 | Rate limit | Retry-After header |
| 500 | Fallo interno | Generico al cliente; log detallado servidor |

Campo code: string estable (USER_NOT_FOUND), no mensaje libre como identificador.

### Fase 5 — Versionado

| Estrategia | Cuando |
|------------|--------|
| URL /v1/ | API HTTP publica grande |
| Header Accept-Version | Clientes sofisticados |
| Campo optional nuevo | Cambio aditivo |
| Deprecation header | Sunset con fecha |
| Major bump | Breaking; changelog + migracion |

Breaking: renombrar/eliminar campo requerido, cambiar tipo, cambiar semantica sin version.

### Fase 6 — Implementacion y prueba

| Paso | Accion |
|------|--------|
| 1 | Generar o escribir schema fuente de verdad |
| 2 | Implementar handler contra schema |
| 3 | Tests: happy path, validacion 400, auth 401/403, not found |
| 4 | Documentar ejemplos request/response en README o OpenAPI |

## Paginacion (referencia)

| Estilo | Pros | Contras |
|--------|------|---------|
| Cursor | Estable en datos mutables | No salto a pagina arbitraria facil |
| Offset | Simple | Inestable en datasets grandes |
| Keyset | Performance en DB | Requiere indice compuesto |

## Idempotencia

| Metodo | Expectativa |
|--------|-------------|
| GET, HEAD | Idempotente |
| PUT | Idempotente por recurso |
| POST accion | Idempotency-Key header si retry posible |
| PATCH | Documentar que campos son parciales |

## Salida obligatoria

```
Recurso / operacion / version
Consumidores
Request schema (campos, tipos, requeridos)
Response exito
Errores (tabla code + HTTP)
AuthN / AuthZ
Paginacion / limites
Idempotencia
Compatibilidad y migracion
Ejemplos request/response
Checklist implementacion + tests
```

## Integracion

| Skill | Cuando |
|-------|--------|
| plan-before-build | Contrato multi-equipo o migracion grande |
| secure-by-default | OAuth, uploads, PII |
| meaningful-tests | Tests contrato |
| technical-docs | OpenAPI publicado o README API |

## Prohibiciones

- Exponer filas DB o ORM entities directamente.
- Codigos error inconsistentes entre endpoints.
- Breaking change sin version ni changelog.
- Mensajes 500 con stack trace al cliente.
