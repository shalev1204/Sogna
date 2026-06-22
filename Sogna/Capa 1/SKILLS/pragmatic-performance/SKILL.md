---
name: pragmatic-performance
description: "Optimizacion basada en medicion: profile, baseline, cuello de botella, cambio acotado, numeros antes despues. Usar en lentitud reportada, SLA incumplido, timeouts, CPU memoria altos, N+1 queries, re-renders, bundle grande, CI lento anomalo, o cuando el Operador pida optimizar, performance, esta lento. No micro-optimizar sin metrica. Escalar infra a plan-before-build. Verify regresion funcional (R3)."
---
# Pragmatic performance

Objetivo: reducir latencia, uso de recursos o coste donde el perfil demuestra cuello de botella real. Medir → cambiar → medir de nuevo con misma carga. Optimizacion especulativa prohibida.

Performance done: numeros antes/después en la metrica que importa al Operador (p95, throughput, memoria RSS, query count).

## Disparadores

| Sintoma | Indicadores |
|---------|-------------|
| Latencia | p95/p99 alto, quejas usuario, spinner |
| Timeouts | HTTP 504, DB statement timeout, job killed |
| Recursos | CPU 100%, OOM, GC thrashing |
| Datos | N+1 queries, full table scan, payload MB |
| Frontend | LCP, TTI, bundle > presupuesto |
| CI | Job duration duplicado sin mas tests |

## Exclusiones

| Situacion | Motivo |
|-----------|--------|
| Sin sintoma ni metrica | YAGNI |
| Codigo cold path | Arranque unico, CLI --help |
| Legibilidad vs ganancia teorica no medida | Rechazar |
| Infra pura (CDN, replica) | plan-before-build |

## Principios

1. Profile no adivinar: datos representativos, no toy datasets salvo repro.
2. Optimizar el 20% que explica 80% del tiempo (Pareto).
3. Presupuesto explicito cuando sea posible (p95 < 200ms).
4. Un cambio medible por iteracion; revertir si no mejora.
5. No romper correctitud por cache agresivo (R3 post-cambio).

## Protocolo

### Fase 1 — Baseline

| Metrica | Herramientas tipicas |
|---------|---------------------|
| Wall time | logs timing, APM, console.time |
| CPU / flame | py-spy, pprof, DevTools Performance |
| Memoria | heap snapshot, RSS monitor |
| SQL | EXPLAIN ANALYZE, slow query log |
| Red | Waterfall DevTools, curl -w |
| Bundle | webpack-bundle-analyzer, source-map-explorer |
| Frontend UX | Lighthouse, Web Vitals |

Documentar: escenario, carga (usuarios concurrentes, filas DB), metrica, valor baseline.

### Fase 2 — Diagnostico

| Clase problema | Senales | Direccion |
|----------------|---------|-----------|
| Algoritmo | O(n²) loop, sort innecesario | Mejor algoritmo/estructura |
| I/O | await serial, sin batch | Paralelizar I/O bound |
| DB | N+1, missing index | join, eager load, indice |
| Cache | Mismo compute repetido | memo con invalidacion clara |
| Red | Chatty API, payload grande | batch, compress, graphql select |
| Render | Re-render cascada | memo, key, virtualize list |
| Alloc | GC pause | reducir objetos temporales |

Identificar hot path: funcion, query, componente, endpoint.

### Fase 3 — Opciones (orden coste/beneficio)

| Orden | Tecnica | Coste implementacion |
|-------|---------|---------------------|
| 1 | Evitar trabajo | Bajo |
| 2 | Hacer menos veces (batch, paginar) | Bajo-medio |
| 3 | Hacer mas barato (indice, algoritmo) | Medio |
| 4 | Cache | Medio-alto (invalidacion) |
| 5 | Paralelizar | Alto (correctitud) |
| 6 | Infra escala | Muy alto |

### Fase 4 — Implementacion

| Regla | Detalle |
|-------|---------|
| Diff minimo | Solo hot path (R1) |
| Invalidacion | TTL, event-driven, version key |
| Regresion | Tests comportamiento + benchmark si existe |
| Trade-off | Documentar memoria vs CPU, stale vs fresh |

### Fase 5 — Validacion

| Comparacion | Misma carga que baseline |
|-------------|---------------------------|
| Mejora | % o ms absolutos |
| Funcional | Suite paquete verde (R3) |
| Insuficiente | Revertir o iterar |

## Presupuestos orientativos (ajustar al proyecto)

| Contexto | Meta ejemplo |
|----------|--------------|
| API read p95 | < 200ms |
| API write p95 | < 500ms |
| Pagina LCP | < 2.5s |
| Query DB | < 50ms p95 |
| Bundle initial JS | presupuesto equipo |

## Anti-patrones performance

| Patron | Problema |
|--------|----------|
| Cache sin invalidacion | Datos stale, bugs |
| Premature index | Escritura lenta |
| Micro-opt loop frio | Ruido en diff |
| Parallel for CPU bound | Peor por overhead |
| Debounce en todo | UX degradada |

## Salida obligatoria

```
Sintoma y metrica baseline (numeros)
Metodologia medicion
Cuello de botella identificado
Cambio aplicado
Resultado numerico antes/despues
Trade-offs
Verify funcional (comando + OK)
Siguiente iteracion (si aplica)
```

## Integracion

| Skill | Cuando |
|-------|--------|
| systematic-debug | Lentitud por bug no perf |
| plan-before-build | Cambio infra o arquitectura |
| meaningful-tests | Benchmark automatizado |
| safe-refactor | Limpiar hot path antes de optimizar |

## Prohibiciones

- Optimizar sin baseline numerico.
- Afirmar mas rapido sin medicion post.
- Cache opaca sin estrategia invalidacion.
- Sacrificar legibilidad extrema por 1% teorico.
