---
name: systematic-debug
description: "Debug sistematico con reproduccion, aislamiento, hipotesis y fix minimo. Usar en tests rojos, excepciones, stack traces, CI fallido, regresiones post-deploy, comportamiento intermitente o determinista incorrecto, timeouts, datos corruptos, o cuando el Operador diga no funciona, falla, error, bug, roto. Complementa R3 verify post-fix. No sustituir plan-before-build en redisenos; no parchear node_modules; no pedir secretos en claro (R5)."
---
# Systematic debug

Objetivo: establecer causa raiz con evidencia reproducible, aplicar correccion minima en el lugar correcto de la pila, verificar eliminacion del sintoma y dejar regresion cuando el riesgo lo exija. La intuicion sin evidencia no cuenta como diagnostico.

## Disparadores

| Categoria | Manifestacion |
|-----------|---------------|
| Tests | Unit, integration, e2e o snapshot fallido; CI rojo |
| Runtime | Excepcion, panic, unhandled rejection, segfault |
| Logs | ERROR, stack trace, codigo HTTP 4xx/5xx inesperado |
| Comportamiento | Output incorrecto, estado inconsistente, race intermitente |
| Regresion | Funcionaba antes de commit, merge o deploy X |
| Entorno | Solo falla en prod, staging, Windows, CI pero no local |

## Exclusiones

| Situacion | Skill alternativa |
|-----------|-------------------|
| Feature nueva mal especificada | plan-before-build |
| Refactor sin bug | safe-refactor |
| Lentitud sin error funcional | pragmatic-performance |
| Vulnerabilidad de seguridad | secure-by-default |

## Principios

1. Reproducir antes de corregir: sin pasos deterministas no hay cierre confiable.
2. Una variable por iteracion: no cambiar cinco cosas y atribuir el exito a una.
3. Evidencia sobre narrativa: logs, debugger mental, diff, git bisect, trazas.
4. Causa raiz, no sintoma: parches que ocultan el error estan prohibidos.
5. Fix minimo alineado al repo (R1); verify obligatorio (R3).

## Protocolo

### Fase 1 — Captura del sintoma

| Campo | Registrar |
|-------|-----------|
| Esperado vs actual | Diferencia observable |
| Input | Datos, params, payload, flags |
| Entorno | OS, runtime version, branch, commit, env vars (nombres, no valores secretos) |
| Frecuencia | Siempre, a veces, bajo carga |
| Primera aparicion | Commit, deploy o fecha si se conoce |

Ejecutar test/comando que falla; guardar salida completa (stderr incluido).

### Fase 2 — Reproducibilidad

| Resultado | Accion |
|-----------|--------|
| Determinista | Continuar a aislamiento |
| Intermitente | Aumentar logging temporal; reducir paralelismo; capturar seed; buscar race o timeout |
| No reproducible local | Comparar entorno CI vs local; permisos; datos; timezone; case sensitivity |

### Fase 3 — Aislamiento

| Tecnica | Uso |
|---------|-----|
| git bisect | Regresion entre commits conocidos bueno/malo |
| git log -p archivo | Cambio reciente en modulo sospechoso |
| Comentar / stub capa | Separar UI vs API vs DB vs config |
| Datos minimos | Reducir input al minimo que aun falla |
| Binary search en codigo | Desactivar mitad de rama logica |

Identificar: archivo, funcion, linea aproximada, capa (config, red, persistencia, logica, presentacion).

### Fase 4 — Hipotesis testables

Formato obligatorio interno:

```
H: [creencia sobre la causa]
P: [prediccion si H es cierta]
T: [accion minima para comprobar P]
```

Priorizar hipotesis baratas: leer codigo, log, assert, breakpoint logico antes de refactor grande.

| Orden tipico de sospecha | Motivo |
|--------------------------|--------|
| Config / env | Valores ausentes o distintos entre entornos |
| Contrato | Tipos, null, off-by-one, timezone |
| Estado compartido | Cache stale, singleton, race |
| Integracion externa | API, DB, cola timeout o error silenciado |
| Regresion logica | Diff reciente en funcion del hot path |

### Fase 5 — Correccion

| Regla | Detalle |
|-------|---------|
| Minimo | Menor diff que elimina causa raiz |
| Estilo | Patrones del archivo vecino (R2) |
| Separacion | No mezclar bugfix con refactor |
| Side effects | Comprobar otros call sites de la misma funcion |

### Fase 6 — Verificacion y regresion (R3)

| Paso | Accion |
|------|--------|
| 1 | Re-ejecutar reproduccion original → verde |
| 2 | Suite del modulo o paquete |
| 3 | Test de regresion si hubiera evitado el bug (meaningful-tests) |
| 4 | Casos limite adyacentes si el bug era de borde |

## Matriz entorno

| Sintoma solo en | Investigar |
|-----------------|------------|
| CI | Scripts, paths, permisos, servicios, version pin |
| Prod | Config, datos reales, escala, feature flags |
| Local | .env local, mocks, version desactualizada |
| Windows vs Unix | Paths, line endings, case, shells |

## Salida obligatoria

```
Sintoma (esperado vs actual)
Reproduccion (pasos + comando exacto)
Entorno relevante
Causa raiz (con evidencia)
Fix aplicado (archivos)
Verificacion (comandos + resultado OK)
Test de regresion (anadido / omitido + motivo)
Riesgo residual
```

## Integracion

| Recurso | Uso |
|---------|-----|
| meaningful-tests | Regresion con valor |
| safe-refactor | Solo si el fix exige mover codigo sin cambiar comportamiento |
| commit-prepare | Tras verify verde |
| R5 | No loguear ni pedir secretos para reproducir |

## Condiciones de parada

| Situacion | Accion |
|-----------|--------|
| No reproducible tras intentos razonables | Documentar; pedir pasos al Operador |
| Bug upstream en dependencia | Issue + pin/workaround; no editar node_modules |
| Requiere datos prod sensibles | Repro sintetico; acceso via Operador |
| Causa en infra fuera del repo | Informe con evidencia; fix en config/doc |

## Prohibiciones

- Cambiar codigo al azar hasta que pase.
- catch {} vacio, retry infinito, null check ciego sin entender.
- Fix solo en prod sin verify local o en CI.
- Afirmar resuelto sin comando ejecutado (R3).
- Silenciar logs de error sin corregir origen.
