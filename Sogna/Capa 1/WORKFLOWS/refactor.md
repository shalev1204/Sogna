# Workflow W5 — Refactor seguro

Procedimiento Capa 1 para mejorar estructura, legibilidad o deuda tecnica sin cambiar comportamiento observable ni anadir features. Secuencia: baseline verify, plan de pasos atomicos, ejecucion con verify intermedio, confirmacion de no-regresion. Reglas R1, R3. Distinto de W1 (feature), W2 (bug) y W6 (empaquetar).

## Cuando usar este workflow

| Situacion | W5 | Alternativa |
|-----------|-----|-------------|
| Renombrar simbolo o archivo | Si | — |
| Extraer funcion/clase/modulo | Si | — |
| Eliminar dead code confirmado | Si | — |
| Simplificar sin cambiar API externa | Si | — |
| Arreglar bug descubierto en refactor | No | W2 (mismo diff solo si trivial) |
| Anadir funcionalidad | No | W1 implement |
| Cambio de contrato publico intencional | No | W1 + api-contract-design |
| Formatear repo entero | No | Solo si Operador lo pide explicitamente |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Objetivo refactor | Si | Extraer AuthService de routes.ts |
| Alcance | Si | Solo src/auth/ |
| Comportamiento | Implicito | Sin cambio observable salvo OK explicito |
| Criterio de exito | Recomendado | Misma suite verde; mismos exports publicos |

Sin alcance acotado: proponer limite en fase 2 antes de editar.

## Fases ejecutables

| Fase | Objetivo | Acciones | Skill |
|------|----------|----------|-------|
| 1 | Baseline | check/test del alcance; guardar resultado | safe-refactor, R3 |
| 2 | Mapa | Archivos, dependencias, exports, call sites | safe-refactor, explore-codebase |
| 3 | Plan pasos | 3-8 pasos atomicos; verify tras cada uno | safe-refactor, plan-before-build |
| 4 | Gate | OK Operador si >2 archivos o riesgo medio+ | — |
| 5 | Ejecutar | Un paso por iteracion logica | safe-refactor, R1 |
| 6 | Verify final | Misma suite que baseline | R3 |
| 7 | Handoff | Resumen; W3 o W6 si aplica | commit-prepare |

### Fase 1 — Baseline

Ejecutar verify del alcance antes de tocar codigo. Si baseline ya rojo: W2 primero, no W5. Registrar comando y resultado como referencia fase 6.

### Fase 2 — Mapa

Listar archivos en alcance. Identificar exports publicos (index.ts, __all__, OpenAPI). Buscar referencias externas al alcance antes de mover.

### Fase 3 — Plan

Pasos pequenos: cada paso debe dejar el repo compilable. Incluir rollback mental (revert ultimo paso).

### Fase 4 — Gate

Mas de 2 archivos, exports publicos, o move cross-package → presentar plan y esperar OK.

### Fase 5-7 — Ejecutar, verify, handoff

Verify intermedio tras pasos de riesgo medio+. Confirmar comportamiento invariante en handoff.

## Tipos de refactor y tactica

| Tipo | Orden recomendado | Riesgo | Verify intermedio |
|------|-------------------|--------|-------------------|
| Rename simbolo | Find all refs; rename; compile | Bajo | check paquete |
| Extract function | Extraer; tests existentes | Bajo | tests modulo |
| Extract module | Interfaces/types primero; mover impl | Medio | tests + check |
| Move file | Mover; fix imports; barrel | Medio | suite paquete |
| Split module | Separar por responsabilidad gradual | Medio-alto | por subpaso |
| Delete dead code | Confirmar cero refs (grep) | Medio | check + tests |
| Inline | Solo si simplifica sin perder claridad | Bajo | check |

Regla: un tipo de movimiento estructural mayor por paso cuando riesgo >= medio.

## Plan pasos (fase 3)

```
Objetivo (sin cambio de comportamiento observable)
Alcance (carpetas/archivos cerrados)
Baseline verify (comando + resultado actual)
Exports publicos a preservar
Pasos:
  1. [accion] → verify: [comando]
  2. ...
Rollback: revert paso N / git checkout -- paths
```

## Verify intermedio y final

| Tras paso | Minimo |
|-----------|--------|
| Rename / extract local | check paquete |
| Move / split | tests del modulo + check |
| Imports transversal | suite paquete afectado |
| Delete code | grep cero refs + check |

Fase 6: repetir exactamente baseline fase 1. Resultado debe ser equivalente (mismos tests, mismo exit code). Si difiere: investigar como W2, no declarar refactor completo.

## Criterios diff (R1)

| Permitido | Prohibido |
|-----------|-----------|
| Reorganizar, renombrar, simplificar | Feature flag nueva |
| Ajustar imports por move | Cambiar logica de negocio |
| Formato en archivos ya tocados si repo lo exige | Reformatear archivos no relacionados |
| Mover comentarios de invariantes | Optimizar perf sin pedido (pragmatic-performance) |
| Tipos/interfaces para clarificar move | Cambiar mensajes user-facing sin OK |

## Comportamiento invariante — checklist

| Check | Como validar |
|-------|--------------|
| Exports publicos | Mismos nombres y firmas |
| HTTP responses | Tests contrato o snapshot si existen |
| CLI flags | --help sin cambios no pedidos |
| Logs user-visible | No cambiar strings salvo OK |
| Side effects | Misma secuencia IO en tests integracion |

## Salida al Operador (fase 7)

```
Objetivo refactor
Alcance
Baseline vs final verify (comandos + resultados)
Pasos ejecutados (lista)
Archivos tocados
Comportamiento: sin cambio observable (confirmacion explicita)
Exports preservados
Deuda no abordada (opcional, una linea)
Siguiente: W3 review | W6 ship | nada
```

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Tests inexistentes en modulo critico | Proponer test minimo meaningful-tests o abortar |
| Refactor revela bug | W2 separado o fix minimo documentado |
| Refactor requiere cambio API | Escalar W1 |
| Baseline rojo | W2 antes de W5 |
| Alcance crece >50% archivos | Re-gate con plan actualizado |

## Anti-patrones

| Evitar | Por que |
|--------|---------|
| Big bang rename sin pasos | Imposible revertir |
| Refactor + feature | Review y rollback imposibles |
| Cambiar semantica "de paso" | No es refactor |
| Confiar solo en compilacion | Comportamiento puede cambiar |

## Prohibiciones

- Refactor masivo sin plan aprobado
- Mezclar bugfix sustancial sin documentar
- commit/push sin mandato (R4)

## Cadena con otros workflows

```
W4 explore (modulo desconocido) → W5 refactor → W3 review (opcional) → W6 ship
```

safe-refactor gobierna tecnicas de paso; plan-before-build gobierna gate en refactors grandes.

## Invocacion

Operador: `/refactor` + objetivo, alcance de carpetas y criterio de exito opcional.
