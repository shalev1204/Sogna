---
name: plan-before-build
description: "Planificacion previa a codigo en tareas ambiguas, multi-archivo o estructurales. Usar cuando falte alcance, haya mas de tres archivos, decisiones de arquitectura, API, datos, migraciones, integraciones nuevas, riesgo de breaking change, o el Operador pida plan, diseno, enfoque, como lo harias, estimacion o OK antes de implementar. Tras explore-codebase si el repo es nuevo. Gate obligatorio salvo procede, implementa o adelante explicitos. No usar en typos, preguntas informativas ni plan ya aprobado en el hilo."
---
# Plan before build

Objetivo: convertir ambiguedad en un plan ejecutable, verificable y acotado en una pantalla; eliminar implementacion a ciegas, scope creep y sorpresas de alcance. El plan es contrato provisional con el Operador hasta recibir OK.

Audiencia: agente ejecutor. El Operador recibe el plan en lenguaje claro (R6), proporcional a la tarea (R7).

## Disparadores

| Categoria | Senales |
|-----------|---------|
| Ambiguedad | Objetivo vago, multiples interpretaciones, requisitos incompletos |
| Superficie | Mas de tres archivos, modulos o paquetes; cambio transversal |
| Estructura | API nueva o cambiante, schema DB, migracion, patron arquitectonico nuevo |
| Riesgo | Breaking change, concurrencia, auth, datos sensibles, rollback dificil |
| Proceso | Operador pide plan, diseno, RFC breve, enfoque, estimacion, fases |
| Pre-requisito | explore-codebase completado y aun falta decision de implementacion |

## Exclusiones

| Situacion | Accion |
|-----------|--------|
| Fix localizado (una causa, uno o dos archivos) | Implementar con verify (R3) |
| Pregunta informativa sin edicion | Responder directo |
| Plan aprobado en el mismo hilo | Ejecutar plan acordado paso a paso |
| Operador dice implementa ya con spec completa | Omitir plan formal; mantener diff minimo (R1) |

## Principios

1. Evidencia antes de propuesta (R2): leer codigo, README, CLAUDE.md, reglas esquina, scripts check/test del paquete afectado.
2. Alcance minimo viable (R1): resolver lo pedido; out-of-scope explicito para refactors, docs, deps, optimizaciones.
3. Opciones con trade-off: maximo tres alternativas; recomendar una con razon en una frase.
4. Verificabilidad: cada paso enlaza a comando o criterio de hecho (R3).
5. Gate: presentar plan y detenerse; implementar solo tras OK textual o autorizacion implicita clara.

## Protocolo

### Fase 0 — Objetivo verificable

Redactar internamente: al terminar, el Operador podra [accion observable] porque [cambio concreto].
Si no puede formularse en una frase, pedir una aclaracion antes de continuar.

### Fase 1 — Contexto (R2)

| Paso | Accion |
|------|--------|
| 1 | Localizar archivos con busqueda; no asumir rutas |
| 2 | Leer modulos vecinos, tipos, exports, tests existentes |
| 3 | Identificar call sites si toca API publica |
| 4 | Anotar restricciones: CI, linter, convenciones, reglas proyecto |
| 5 | Si repo desconocido: invocar explore-codebase primero |

### Fase 2 — Delimitacion

| Elemento | Contenido |
|----------|-----------|
| In scope | Lista cerrada de entregables |
| Out of scope | Refactors, docs, tests extra, optimizaciones no pedidas |
| Supuestos | Lo que se da por hecho si el Operador no aclara |
| Riesgos | Regresion, migracion, compatibilidad, deuda tocada de rebote |
| Dependencias | Orden entre pasos; bloqueos externos |

### Fase 3 — Diseno de solucion

| Pregunta | Respuesta en el plan |
|----------|---------------------|
| Enfoque | Una opcion principal; alternativas solo si el trade-off importa |
| Archivos | Lista cerrada; marcar creados vs modificados |
| Pasos | 3-8 ordenados; cada uno completable y verificable aisladamente |
| Datos/API | Contratos afectados → enlace mental a api-contract-design si aplica |
| Rollback | Como deshacer si falla verify o staging |

### Fase 4 — Verificacion planificada

| Nivel de cambio | Verify minimo |
|-----------------|---------------|
| Typo / comentario | Lint o check rapido si existe |
| Logica en un modulo | Tests del modulo + check paquete |
| API o schema | Tests contrato + consumidores rastreados |
| Transversal | Suite paquete; CI completo solo si lo pide Operador |

### Fase 5 — Gate y ejecucion

Presentar salida obligatoria. Detenerse.
Tras OK: un paso del plan → verify parcial → siguiente (R1, R3). No acumular pasos sin verify intermedio en cambios de riesgo medio-alto.

## Plantilla de opciones (si hay fork)

| Opcion | Pros | Contras | Recomendada |
|--------|------|---------|-------------|
| A | | | si/no |
| B | | | si/no |

## Salida obligatoria al Operador

```
Objetivo verificable (una frase)
Enfoque recomendado
Alternativas descartadas o secundarias (si aplica)
In scope / Out of scope
Archivos a crear o modificar
Pasos ordenados (3-8) con verify por paso
Comandos de verificacion final
Riesgos y mitigaciones
Preguntas abiertas (solo bloqueantes)
```

## Integracion

| Skill / regla | Cuando |
|---------------|--------|
| explore-codebase | Repo o modulo desconocido |
| api-contract-design | Contrato publico nuevo o cambiante |
| safe-refactor | Plan incluye solo reestructuracion |
| meaningful-tests | Plan debe incluir regresion |
| commit-prepare | Tras ejecutar plan completo |
| R1 | Diff minimo en ejecucion |
| R7 | Plan = una pantalla; no RFC de 20 paginas salvo pedido |

## Condiciones de parada

- Informacion critica ausente: una pregunta concreta; no planificar en vacio.
- Mas de cinco archivos no pedidos en el plan: recortar y pedir confirmacion (R1).
- Conflicto con reglas proyecto: citar regla; proponer alternativa alineada.
- Dos patrones contradictorios en repo: presentar ambos; no elegir al azar (R2).
- Operador pide solo estimacion temporal: responder en el plan sin implementar.

## Prohibiciones

- Implementar en la misma respuesta que el plan salvo OK.
- Anadir dependencias, capas o abstracciones no justificadas en el plan (R1).
- Plan especificacion completa no solicitada (R7).
- Omitir verify planificado en la ejecucion (R3).
