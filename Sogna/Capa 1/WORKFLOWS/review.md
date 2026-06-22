# Workflow W3 — Revisar cambios

Procedimiento Capa 1 para revision tecnica pre-merge o pre-PR: leer diff, aplicar checklist, clasificar hallazgos, emitir veredicto accionable. Prioriza correctitud y riesgo sobre estilo subjetivo. Complementa linters, CI y subagentes review-bugbot / review-security; no los reemplaza.

## Cuando usar este workflow

| Situacion | W3 | Alternativa |
|-----------|-----|-------------|
| Pre-PR, pre-merge, second opinion | Si | — |
| Operador pide revisar rama o diff | Si | — |
| Implementar codigo nuevo | No | W1 implement |
| Auditar repo entero sin diff concreto | No | W4 explore |
| Auto-revision ligera antes de commit propio | No | W6 ship fase 2 |
| Compliance formal (SOC2, legal) | Parcial | Escalar humano |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Alcance del diff | Si | Rama feature/oauth, archivos listados, PR #12 |
| Objetivo del cambio | Recomendado | Anade login OAuth Google |
| Barra de merge | Opcional | Hotfix prod vs refactor interno |
| Foco | Opcional | Seguridad, performance, API |

Sin lectura del diff: prohibido veredicto APPROVE. Si no hay diff: pedir rama, commit range o archivos.

## Fases ejecutables

| Fase | Objetivo | Acciones | Skill |
|------|----------|----------|-------|
| 1 | Contexto | Objetivo del cambio; commits incluidos; autor intent | code-review |
| 2 | Lectura | git diff; archivos completos si falta contexto | code-review, R2 |
| 3 | Checklist | Correctitud, seguridad, mantenibilidad, ops, tests | code-review |
| 4 | Clasificar | Critical / Major / Minor / Question | code-review |
| 5 | Seguridad+ | Si auth/datos/deps: profundizar | secure-by-default |
| 6 | Veredicto | APPROVE / REQUEST CHANGES / NEEDS DISCUSSION | code-review |
| 7 | Entrega | Informe con ubicaciones y sugerencias | — |

### Fase 1 — Contexto

Entender que problema resuelve el diff antes de juzgar lineas. Leer descripcion PR o mensaje del Operador. Anotar si el cambio es hotfix, feature o refactor mezclado (penalizar mezcla en severidad).

### Fase 2 — Lectura

Leer diff completo del alcance declarado. Si un hunk no tiene contexto: abrir archivo completo en regiones tocadas. Seguir imports nuevos y exports modificados. No revisar solo titulos de archivo.

### Fase 3-5 — Checklist y profundidad

Aplicar checklist abajo. Si el diff toca auth, PII, pagos, crypto, uploads, SQL dinamico: activar secure-by-default adicional. Si nuevo endpoint publico: mental check api-contract-design.

### Fase 6-7 — Veredicto y entrega

Veredicto segun tabla severidades. Informe accionable: cada hallazgo con path:linea o funcion identificable.

## Checklist detallado

### Correctitud

| Punto | Pregunta |
|-------|----------|
| Requisito | El diff satisface el objetivo declarado |
| Bordes | null, vacio, max length, timezone, overflow, unicode |
| Errores | Paths de error manejados; no swallow silencioso |
| Concurrencia | Races, locks, idempotencia en retries |
| API publica | Breaking change documentado; versionado si aplica |
| Estado | Invalid states imposibles o detectados |

### Seguridad (vista rapida)

| Punto | Pregunta |
|-------|----------|
| Input | Validado en borde confiable |
| AuthN/AuthZ | Identidad y permiso correctos por operacion |
| Secretos | Nada en codigo, logs, tests, fixtures (R5) |
| Inyeccion | SQL parametrizado, XSS escapado, path traversal |
| Deserializacion | Fuentes no confiables tratadas |
| Dependencias | Version con CVE conocido no introducida |

### Mantenibilidad (R1)

| Punto | Pregunta |
|-------|----------|
| Alcance | Diff minimo; sin scope creep evidente |
| Claridad | Nombres acordes al modulo vecino |
| Duplicacion | Logica copiada que deberia extraerse (Minor) |
| Tests | Proporcionales al riesgo; assert significativos |
| Comentarios | Solo donde el codigo no se explica solo |

### Operaciones

| Punto | Pregunta |
|-------|----------|
| Migraciones | Reversible o plan rollback |
| Performance | N+1 queries, O(n²) en loop caliente |
| Observabilidad | Logs utiles en failure paths |
| Feature flags | Comportamiento seguro si flag off |
| Config | Defaults seguros; fail closed |

## Severidades y merge

| Nivel | Definicion | Merge |
|-------|------------|-------|
| Critical | Bug prod seguro, seguridad explotable, perdida datos | Bloquear |
| Major | Incidente probable; logica incorrecta en flujo comun | Bloquear recomendado |
| Minor | Nit alineado a convencion del repo; mejora opcional | No bloquear |
| Question | Falta contexto producto o decision arquitectonica | Discutir |

| Veredicto | Cuando |
|-----------|--------|
| APPROVE | Sin Critical; Major resueltos o riesgo aceptado explicitamente por Operador |
| REQUEST CHANGES | Critical o Major abiertos |
| NEEDS DISCUSSION | Ambiguedad producto, arquitectura o requisito contradictorio |

## Diff grande o compuesto

| Tamano / tipo | Estrategia |
|---------------|------------|
| >500 lineas | Revisar por commit o modulo; declarar cobertura parcial en informe |
| Generado + manual | Foco en manual y contratos entre ambos |
| Refactor + feature mezclados | Pedir split; revisar por intencion separada |
| Solo rename/move | Verificar referencias y exports rotos |

## Salida al Operador (fase 7)

```
Veredicto: APPROVE | REQUEST CHANGES | NEEDS DISCUSSION
Resumen (2-3 frases)
Alcance revisado (commits, archivos, lineas aprox, gaps si parcial)
Hallazgos
  Critical: [path:linea] problema → sugerencia concreta
  Major: ...
  Minor: ...
  Questions: ...
Aspectos correctos (2-3 especificos, no genericos)
Verify del autor (observado en diff / faltante — sugerir comando)
Siguiente paso (corregir, merge, W6 ship, re-review)
```

Cada hallazgo accionable: ubicacion precisa, problema, sugerencia implementable.

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Falta objetivo producto para juzgar UX | NEEDS DISCUSSION |
| Solo preferencia estetica sin guia repo | Minor max; no REQUEST CHANGES |
| Diff ilegible (minificado, binario) | Declarar limite; revisar lo legible |
| Operador pide APPROVE rapido con Critical | Mantener REQUEST CHANGES; explicar riesgo |

## Anti-patrones del revisor

| Evitar | Por que |
|--------|---------|
| APPROVE sin leer archivos tocados | Falsa seguridad |
| Nitpicks masivos fuera guia del repo | Ruido |
| Imponer patron ajeno al codebase | R2 |
| Ignorar tests omitidos en cambio riesgoso | Major potencial |

## Prohibiciones

- Veredicto sin evidencia de lectura
- Bloquear por gusto personal
- Reescribir el codigo del autor en review (sugerir, no reemplazar salvo pedido)

## Cadena con otros workflows

```
W1 | W2 | W5 (autor) → W3 review → merge / W6 ship
```

W3 invoca code-review y secure-by-default cuando aplica. Para auditoria automatizada adicional el Operador puede lanzar review-bugbot o review-security en paralelo.

## Invocacion

Operador: `/review` + alcance (diff, rama, enlace PR, archivos).
