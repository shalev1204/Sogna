# Workflow W2 — Corregir bug

Procedimiento Capa 1 para cerrar un defecto con trazabilidad: reproduccion, causa raiz demostrada, fix minimo, regresion cuando aporta valor, verify documentado. Comportamiento observable debe quedar corregido. Reglas R1-R8. No mezclar feature (W1), refactor puro (W5) ni revision ajena (W3).

## Cuando usar este workflow

| Situacion | W2 | Alternativa |
|-----------|-----|-------------|
| Test fallando, excepcion, output incorrecto | Si | — |
| Regresion tras deploy o merge | Si | — |
| Comportamiento intermitente reportado | Si (fase repro extendida) | — |
| Lentitud sin error funcional | No | pragmatic-performance |
| Deuda estructural sin bug reportado | No | W5 refactor |
| Feature mientras se arregla | No | Separar W1 y W2 en diffs |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Sintoma | Si | 500 en POST /login; test auth.test.ts rojo |
| Expectativa vs actual | Recomendado | Deberia 200 con token; recibe 401 |
| Entorno | Recomendado | local / CI job X / prod; branch; commit sospechoso |
| Evidencia | Si existe | Stack trace, log, screenshot descrito |
| Severidad | Opcional | bloqueante prod vs menor |

Sin sintoma: preguntar una vez con campos concretos. No parchear a ciegas ni probar cambios aleatorios.

## Fases ejecutables

| Fase | Objetivo | Acciones clave | Skill |
|------|----------|----------------|-------|
| 1 | Captura | Esperado/actual, input, env (nombres, no valores secretos R5) | systematic-debug |
| 2 | Reproducir | Test/comando; guardar stderr/stdout completo | systematic-debug |
| 3 | Clasificar | Determinista / intermitente / solo remoto | systematic-debug |
| 4 | Acotar | bisect mental, capa, archivo candidato | systematic-debug |
| 5 | Hipotesis | H / P / T; una variable por iteracion | systematic-debug |
| 6 | Fix | Diff minimo en causa raiz | systematic-debug, R1 |
| 7 | Regresion | Test que hubiera fallado antes del fix | meaningful-tests |
| 8 | Verify | Repro + suite relacionada + check | R3 |
| 9 | Handoff | Informe estructurado | commit-prepare |

### Fase 1 — Captura

Documentar en prosa corta: quien, que accion, que fallo, cuando empezo si se sabe. Separar sintoma (observable) de hipotesis del Operador (anotar pero verificar).

### Fase 2-3 — Reproducir y clasificar

Ejecutar el comando o test que reproduce. Si pasa local pero falla CI: diff de entorno (OS, Node version, env vars por nombre, paths). Clasificar antes de editar codigo.

### Fase 4-5 — Acotar e hipotesis

Reducir superficie: ultimo commit bueno, modulo, funcion. Formato obligatorio por iteracion:

```
H: [creencia sobre causa]
P: [prediccion observable si H es cierta]
T: [experimento minimo: leer, log, assert, breakpoint mental]
```

Priorizar T barato antes de refactor grande.

### Fase 6 — Fix

Cambiar la linea o logica causante, no el sintoma lejano. Alinear estilo con archivo. Si el fix correcto requiere rediseno: escalar a W1 con plan, no parche eterno.

### Fase 7-9 — Regresion, verify, handoff

Test de regresion cuando el bug es logico y reproducible. Verify con comandos literales del repo. Handoff con plantilla completa.

## Reproduccion (fases 2-3)

| Clase | Indicios | Tactica |
|-------|----------|---------|
| Determinista | Mismo fallo siempre | Continuar acotacion directa |
| Intermitente | Race, timeout, orden async | Reducir paralelismo; fijar seed; logs puntuales |
| Solo CI | Pasa local | Diff env, paths case-sensitive, permisos, cache CI |
| Solo prod | No local | Datos sinteticos; pedir dump anonimizado al Operador |
| Heisenbug | Desaparece al loguear | Log minimo; bisect por commits |

Si no reproducible tras intentos razonables (3+ enfoques): informe de intentos + datos faltantes; no declarar fixed.

## Hipotesis — orden de ataque tipico

| Orden | Capa | Chequeo rapido |
|-------|------|----------------|
| 1 | Config/env | .env.example, flags, missing var |
| 2 | Input/validacion | null, empty, tipo incorrecto |
| 3 | Logica reciente | git blame en linea sospechosa |
| 4 | Integracion | API externa, timeout, mock |
| 5 | Concurrencia | shared state, cache stale |

## Fix (fase 6)

| Permitido | Prohibido |
|-----------|-----------|
| Corregir linea/logica causante | catch {} vacio que oculta |
| Guard clause explicita | Retry infinito |
| Alinear con estilo del archivo | Editar node_modules o vendor |
| Fix + test regresion en mismo diff | Refactor extenso mezclado (W5) |

## Regresion (fase 7)

| Escenario | Test |
|-----------|------|
| Bug logico claro | Caso que fallaba y ahora pasa |
| Off-by-one, null, borde | Parametrizar el caso exacto |
| Typo/config una linea | Omitir test; documentar en handoff |
| Flaky preexistente | Arreglar determinismo; no anadir flaky nuevo |
| Integracion externa | Mock del contrato; no llamada real |

## Verify (fase 8)

1. Reproduccion original → verde (mismo comando que fase 2)
2. check/test del paquete (comando canonico del repo)
3. Casos limite adyacentes si el bug era de borde (vecino del input fallido)

Registrar en respuesta: cada comando + resultado. R3. Si verify falla: no cerrar W2; iterar fases 4-6.

## Salida al Operador (fase 9)

```
Sintoma (copia fase 1)
Reproduccion (pasos + comando exacto)
Entorno relevante (sin secretos)
Causa raiz (evidencia: que archivo/linea/log demostro H)
Fix (archivos + cambio conceptual en una frase)
Regresion (test id / omitido + motivo)
Verify (comandos + OK/FAIL)
Riesgo residual (si aplica)
Siguiente: W6 ship | W3 review | W1 si requiere feature | nada
```

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Bug en dependencia upstream | Issue upstream + pin version; no patch local permanente |
| Fix requiere rediseno | Escalar W1 con plan |
| Vulnerabilidad explotable activa | secure-by-default; priorizar; avisar Operador de inmediato |
| Secretos necesarios para repro | Pedir vars por nombre; nunca pedir valores en chat (R5) |
| Datos prod necesarios | Anonimizar; reproducir sintetico |

## Anti-patrones

| Evitar | Por que |
|--------|---------|
| Cambiar codigo hasta verde sin H/P/T | No demuestra causa raiz |
| Afirmar resuelto sin comando | Viola R3 |
| Bugfix + feature mismo commit | Review imposible |
| Silenciar error con log level | Oculta regresiones futuras |

## Prohibiciones

- Parchear sin reproduccion o sin explicar por que no reproduce
- commit/push sin mandato (R4)
- Mezclar W5 refactor masivo en mismo diff

## Cadena con otros workflows

```
W4 explore (modulo desconocido) → W2 fix-bug → W3 review (opcional) → W6 ship
```

systematic-debug gobierna fases 1-6; meaningful-tests gobierna regresion. W2 no duplica el protocolo H/P/T del skill: lo aplica.

## Invocacion

Operador: `/fix-bug` + sintoma, logs, nombre del test rojo o pasos para reproducir.
