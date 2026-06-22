---
name: safe-refactor
description: "Refactor incremental con comportamiento observable invariante: extract, rename, move, deduplicacion local. Usar al mejorar estructura sin nueva feature, reducir deuda acotada, preparar terreno para cambio futuro, o cuando el Operador pida refactor seguro, limpiar codigo, reorganizar modulo. Verify entre pasos (R3). Escalar a plan-before-build si API publica cambia o superficie supera cinco archivos no pedidos (R1)."
---
# Safe refactor

Objetivo: mejorar legibilidad, cohesion y ubicacion del codigo sin alterar comportamiento observable ni romper contratos implicitos. Cada paso deja el arbol compilable y verificable.

Comportamiento observable: mismos inputs producen mismos outputs, mismos efectos secundarios externos (IO, DB, eventos), mismas firmas publicas salvo acuerdo explicito.

## Disparadores

| Tipo | Ejemplos |
|------|----------|
| Extract | Funcion, clase, hook, util desde bloque inline |
| Rename | Simbolo, archivo, modulo con alcance delimitado |
| Move | Archivo a carpeta correcta; actualizar imports |
| Dedup | Dos bloques casi iguales en mismo dominio |
| Simplify | Condicionales, early return sin cambiar logica |
| Prepare | Dejar modulo listo para feature acordada despues |

## Exclusiones

| Situacion | Skill correcta |
|-----------|----------------|
| Cambio funcional intencional | Feature o bugfix |
| Rewrite total | plan-before-build |
| Bug mezclado con limpieza | systematic-debug primero; separar commits |
| Optimizacion de performance | pragmatic-performance |

## Principios

1. Invariante de comportamiento salvo OK del Operador.
2. Pasos pequenos: compila y pasa check tras cada uno (R3).
3. Un eje de cambio por paso: no rename + extract + format + logica.
4. Herramientas del lenguaje antes que buscar-reemplazar ciego.
5. Diff reviewable: solo refactor (R1).

## Protocolo

### Fase 1 — Baseline y riesgo

| Paso | Accion |
|------|--------|
| 1 | Ejecutar check/test del area; confirmar verde |
| 2 | Mapear exports publicos y call sites (R2) |
| 3 | Evaluar cobertura: si riesgo alto y cero tests → test caracterizacion minimo |
| 4 | Estimar archivos; si >5 no pedidos → plan-before-build o acotar (R1) |

Test de caracterizacion: assert del comportamiento actual antes de mover codigo; ancla contra regresion silenciosa.

### Fase 2 — Plan de micro-pasos

Secuencia canonica extract + rename + move:

| Paso | Accion | Verify |
|------|--------|--------|
| 1 | Extract in-place (misma archivo) | check |
| 2 | Extract a archivo nuevo si procede | check + imports |
| 3 | Rename simbolo (LSP/rename symbol) | check + grep residuos |
| 4 | Move archivo; fix imports | check + test modulo |
| 5 | Eliminar exports muertos | check suite |

Otras secuencias validas: rename primero si el nombre bloquea lectura; move solo si extract no necesario.

### Fase 3 — Ejecucion

| Regla | Detalle |
|-------|---------|
| Atomicidad | Commit logico mental por paso; Operador puede pedir un solo commit al final |
| Imports | Actualizar todos; no dejar circular nuevo |
| Visibilidad | Mantener export/public equivalente |
| Comentarios | No reescribir docs masivas; solo si el move lo exige |

### Fase 4 — Cierre

| Verificacion | Comparar vs baseline |
|--------------|---------------------|
| check / lint | Igual o mejor |
| tests area | Verde |
| diff | Sin cambios de logica detectables en review |

## Catalogo de tecnicas

| Tecnica | Segura cuando | Riesgo |
|---------|---------------|--------|
| Extract function | Bloque con entradas/salidas claras | Medio si muta estado externo |
| Inline | Indirection sin valor | Bajo |
| Rename | Alcance acotado, LSP | Alto si stringly-typed |
| Move module | Imports trazables | Medio en barrels/index |
| Replace temp with query | Sin efectos colaterales | Medio |
| Split module | Responsabilidades obvias | Alto si ciclo deps |

## Salida obligatoria

```
Objetivo del refactor
Riesgo evaluado (bajo/medio/alto)
Pasos ejecutados (orden)
Archivos tocados
Baseline verify vs final verify
Test caracterizacion (si/no)
Deuda restante (opcional, una linea)
```

## Integracion

| Skill | Cuando |
|-------|--------|
| plan-before-build | Superficie grande o API publica |
| api-contract-design | Firma publica debe cambiar |
| meaningful-tests | Anadir caracterizacion o regresion |
| code-review | Auto-review del diff refactor-only |
| commit-prepare | Empaquetar al terminar |

## Condiciones de parada

- Tests ausentes + refactor de alto riesgo: caracterizacion primero.
- Acoplamiento oculto (reflection, dynamic import): acotar o pedir OK.
- Dos patrones en conflicto en el modulo: no unificar sin mandato (R2).

## Prohibiciones

- Big bang en un diff enorme.
- Mezclar bugfix, feature y refactor (dificulta bisect y review).
- Reformateo masivo no relacionado (R1).
- Cambiar API publica sin rastrear consumidores (R2).
