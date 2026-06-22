# Workflow W1 — Implementar feature

Procedimiento Capa 1 para entregar funcionalidad nueva o cambio de comportamiento acotado. Secuencia: entender, planificar, gate del Operador, implementar con diff minimo, verificar con evidencia. Aplica a cualquier repo. Reglas R1-R8 activas. No sustituye W2 (bug), W5 (refactor sin feature) ni W6 (ship final).

## Cuando usar este workflow

| Situacion | Usar W1 | Usar otro |
|-----------|---------|-----------|
| Feature nueva o cambio funcional | Si | — |
| Bug o regresion | No | W2 fix-bug |
| Solo reestructurar sin cambiar comportamiento | No | W5 refactor |
| Repo desconocido sin mapa | Primero W4 explore | — |
| Solo preparar commit/PR sin codificar | No | W6 ship |
| Spike exploratorio sin entrega | W4 + plan corto | W1 solo si hay entrega |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Objetivo verificable | Si | Usuario puede exportar CSV desde /reports |
| Contexto | Recomendado | Issue #42, mockup, archivos relacionados |
| Restricciones | Si existen | Solo paquete api; no tocar frontend |
| Prioridad | Opcional | MVP vs completo |
| OK implicito | No asumir | procede / implementa / adelante = gate pasado |

Sin objetivo verificable: una pregunta concreta con opciones. No planificar en vacio ni asumir producto.

## Fases ejecutables

| Fase | Objetivo | Acciones | Skill / regla |
|------|----------|----------|---------------|
| 0 | Orientacion | README, scripts verify, reglas esquina del proyecto | explore-codebase, R8 |
| 1 | Evidencia | Modulos vecinos, call sites, tests, convenciones | R2 |
| 2 | Alcance | In/out scope, supuestos, riesgos, dependencias | plan-before-build, R1 |
| 3 | Plan | Documento 1 pantalla (plantilla abajo) | plan-before-build |
| 4 | Gate | Presentar plan; detenerse hasta OK | — |
| 5 | Build | Pasos acordados; verify parcial en hitos | R1, R3 |
| 6 | Verify final | check/test paquete; evidencia en respuesta | R3, meaningful-tests |
| 7 | Handoff | Resumen estructurado; siguiente workflow | commit-prepare, R4 |

### Fase 0 — Orientacion (solo si hace falta)

Ejecutar cuando el agente no conoce el repo o el subarbol del cambio. Leer README raiz o del paquete, package.json/pyproject, scripts npm/pnpm/make, CI si existe. Anotar comando verify canonico. Si la pregunta es donde esta X, delegar a W4 explore antes de W1 fase 1.

### Fase 1 — Evidencia (R2)

Buscar archivos reales; no inferir rutas. Leer implementaciones similares ya en el repo (mismo patron de handler, hook, servicio). Identificar tests existentes del modulo: extenderlos antes de crear suite paralela. Si hay API publica: listar consumidores internos visibles.

### Fase 2-3 — Alcance y plan

Invocar criterios de plan-before-build: objetivo en una frase observable, maximo 3 alternativas con recomendacion, pasos 3-8 con verify por paso. Out of scope explicito: refactors, docs, deps, optimizaciones no pedidas.

### Fase 4 — Gate

Presentar plan completo. Detener edicion de codigo en la misma respuesta salvo OK textual del Operador (procede, implementa, adelante, OK al plan). Si el Operador corrige alcance, actualizar plan antes de fase 5.

### Fase 5 — Build

Un paso logico por iteracion cuando el cambio es grande. Tras cada paso de riesgo (schema, auth, contrato): verify parcial. No acumular pasos sin verify si el paso puede romper compilacion.

### Fase 6-7 — Verify y handoff

Verify final obligatorio con comando del repo. Handoff con plantilla de salida. Sugerir W6 ship si hay cambios listos; W3 si el Operador pide segunda opinion antes de integrar.

## Plantilla plan (fase 3, obligatoria)

```
Objetivo verificable (una frase)
Enfoque recomendado (+ alternativa breve si el trade-off importa)
In scope / Out of scope
Supuestos / Riesgos
Archivos crear o modificar (lista cerrada)
Pasos ordenados (3-8) con verify por paso
Comandos verify final
Preguntas abiertas (solo bloqueantes)
Rollback mental (como deshacer si falla verify)
```

## Matriz de decision en fase 5

| Situacion detectada | Accion antes de continuar |
|---------------------|---------------------------|
| Endpoint o SDK publico nuevo | Criterios api-contract-design: versionado, errores, idempotencia |
| Auth, PII, pagos, tokens | Checklist secure-by-default completo |
| Mas de 3 archivos no previstos | Parar; ampliar plan o pedir OK (R1) |
| Test rojo preexistente | Informar; no mezclar W2 sin OK explicito |
| Patron contradictorio en repo | Dos opciones al Operador con pros/contras; no adivinar (R2) |
| Migracion DB o schema | Paso dedicado + rollback documentado |
| Performance critica declarada | Criterios pragmatic-performance en diseno |

## Criterios de calidad del diff (R1)

| Criterio | Cumplir |
|----------|---------|
| Archivos | Solo causalmente necesarios al objetivo |
| Dependencias | No anadir npm/pip/cargo salvo necesidad demostrada |
| Refactor colateral | Prohibido salvo imprescindible para compilar |
| Comentarios | Solo invariantes no obvios del dominio |
| Deuda adyacente | Una linea al final del handoff; no arreglar sin OK |
| Estilo | Igual que archivos vecinos (nombres, imports, errores) |

## Verificacion por riesgo (fase 6)

| Riesgo del cambio | Verify minimo |
|-------------------|---------------|
| Logica en un modulo | Tests del modulo + check paquete |
| Contrato HTTP/export publico | Happy path + error de validacion + breaking check |
| Cambio transversal (3+ paquetes) | Suite de cada paquete tocado |
| Solo copy/config | check o smoke documentado |
| UI visible | Build + nota manual si no hay e2e |

Obligatorio en respuesta: comando ejecutado + exit code o resultado textual. Prohibido listo sin evidencia (R3).

## Tests (meaningful-tests)

| Escenario | Accion |
|-----------|--------|
| Logica de negocio nueva | Al menos un test que falle si se rompe el requisito |
| Wiring trivial | Omitir test; documentar en handoff |
| Operador pidio tests | Priorizar casos borde del requisito, no asserts triviales |
| Flaky existente | No anadir flaky; estabilizar o aislar |

## Modos de ejecucion

| Modo | Cuando | Gate |
|------|--------|------|
| Standard | Default multi-archivo o ambiguo | Plan completo + OK |
| Spec completa | Operador da spec detallada y dice implementa ya | Plan mental breve; diff minimo |
| Incremental | Feature grande acordada por fases | Gate por fase entregable |
| Hotfix feature | Urgencia con alcance minimo | Plan de 3 lineas + OK verbal |

## Salida al Operador (fase 7)

```
Resumen (que cambia y por que, 2-4 frases)
Archivos tocados (lista)
Plan vs ejecutado (desviaciones y motivo)
Verify (comandos + resultados literales)
Tests anadidos o omitidos (motivo)
Deuda restante (opcional, una linea)
Siguiente paso: W6 ship | W3 review | nada
```

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Ambiguedad arquitectonica sin default en repo | Gate; no implementar |
| Mas de 5 archivos fuera del plan | Recortar alcance; confirmacion |
| Senal fuerte de Capa 2/3 (Sogna, etc.) | Anotar; no cargar SSOT institucional en Capa 1 |
| Operador cancela mid-flight | Detener; resumir estado parcial y archivos a medias |
| Verify falla tras build | No handoff verde; diagnosticar o escalar W2 |

## Anti-patrones

| Evitar | Por que |
|--------|---------|
| Implementar y planificar despues | Viola gate y R1 |
| Copiar patron de otro repo | Viola R2 |
| Anadir libreria por comodidad | Scope creep |
| Reformatear archivos no tocados | Ruido en review |
| commit/push sin mandato | R4 |

## Prohibiciones

- Implementar multi-archivo sin plan aprobado
- git commit / git push / gh pr create sin mandato (R4)
- Documentacion no solicitada (R7)
- --no-verify en hooks (R4)

## Cadena con otros workflows

```
W4 explore (opcional) → W1 implement → W3 review (opcional) → W6 ship
```

W1 referencia skills; no duplica su protocolo interno. plan-before-build gobierna fases 2-4; meaningful-tests gobierna tests; api-contract-design y secure-by-default se activan por matriz de decision.

## Invocacion

Operador: `/implement` + objetivo verificable, contexto y restricciones.
