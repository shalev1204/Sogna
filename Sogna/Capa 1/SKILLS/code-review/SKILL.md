---
name: code-review
description: "Revision profesional de diffs: correctitud, riesgo, seguridad rapida, mantenibilidad y operaciones. Usar antes de PR o merge, tras cambios grandes o multi-archivo, cuando el Operador pida review, revisa esto, pre-merge, esta bien, second opinion, o tras auto-revision antes de entregar. Complementa review-bugbot y review-security nativas; no las sustituye. Severidades Critical/Major/Minor/Question con veredicto APPROVE, REQUEST CHANGES o NEEDS DISCUSSION."
---
# Code review

Objetivo: emitir juicio tecnico accionable sobre un diff concreto: si es seguro integrar, que corregir antes del merge y que riesgos aceptar conscientemente. La revision prioriza correctitud y riesgo sobre estilo subjetivo.

## Disparadores

| Momento | Contexto |
|---------|----------|
| Pre-PR | Antes de gh pr create o equivalente |
| Pre-merge | Operador a punto de integrar rama |
| Post-implementacion | Auto-revision antes de commit-prepare |
| Peticion explicita | review, audita, second opinion |
| Cambio caliente | Hotfix, rollback, parche de seguridad |

## Exclusiones

| Situacion | Alternativa |
|-----------|-------------|
| Escaneo automatizado CI | review-bugbot, linters, SAST |
| Auditoria seguridad profunda | review-security, secure-by-default |
| Historial git completo por leaks | secure-by-default + Operador |
| Review de diseno futuro sin diff | plan-before-build |

## Principios

1. Correctitud primero: hace lo que debe bajo condiciones normales y de borde.
2. Convenciones del repo prevalecen sobre gusto del modelo (R1, R2).
3. Profundidad proporcional al riesgo: auth, pagos, datos, concurrencia = mas rigor.
4. Cada hallazgo es accionable: ubicacion, problema, sugerencia concreta.
5. Veredicto honesto: no APPROVE por complacencia ni REQUEST CHANGES por nits solamente.

## Protocolo de lectura

| Orden | Que leer |
|-------|----------|
| 1 | Descripcion del cambio / mensaje commit / objetivo del Operador |
| 2 | git diff completo o archivos listados en el PR |
| 3 | Archivos completos si el diff carece de contexto (imports, tipos) |
| 4 | Tests anadidos o modificados |
| 5 | Call sites si cambia API publica (R2) |

No emitir veredicto sin haber leido los archivos tocados.

## Checklist por dimension

### Correctitud

| Punto | Pregunta |
|-------|----------|
| Requisito | El diff satisface el objetivo declarado |
| Bordes | null, vacio, max length, overflow, timezone |
| Errores | Paths de error manejados; no swallow silencioso |
| Concurrencia | Races, locks, idempotencia si aplica |
| Compatibilidad | Breaking change en API publica documentado |

### Seguridad (vista rapida)

| Punto | Pregunta |
|-------|----------|
| Input | Validado en borde confiable |
| AuthZ | Permisos correctos por operacion |
| Secretos | Nada en codigo, logs, tests (R5) |
| Inyeccion | SQL, command, path traversal mitigados |

### Mantenibilidad (R1)

| Punto | Pregunta |
|-------|----------|
| Alcance | Diff minimo; sin scope creep |
| Claridad | Nombres y estructura acordes al modulo |
| Abstraccion | Sin capas prematuras |
| Duplicacion | Aceptable vs extraer (no refactor no pedido) |

### Tests y verify (R3)

| Punto | Pregunta |
|-------|----------|
| Cobertura | Tests proporcionales al riesgo |
| Verify | Evidencia de check/test ejecutado |
| Regresion | Bugfix incluye test util si aplica |

### Operaciones

| Punto | Pregunta |
|-------|----------|
| Migraciones | Reversibles o plan de rollback |
| Performance | Cambio obviamente O(n²) o N+1 |
| Observabilidad | Logs/metricas en paths criticos |

## Severidades

| Nivel | Definicion | Ejemplos | Merge |
|-------|------------|----------|-------|
| Critical | Bug produccion, seguridad, perdida datos, corrupcion | SQL injection, auth bypass, race perdida evento | Bloquear |
| Major | Incidente probable pronto; logica incorrecta en caso común | Error no manejado en path principal, break API sin version | Bloquear recomendado |
| Minor | Estilo, nit, mejora opcional alineada a convencion | Naming, simplificacion local | No bloquear |
| Question | Contexto insuficiente | Intencion de diseno ambigua | Discutir |

## Veredictos

| Veredicto | Cuando |
|-----------|--------|
| APPROVE | Sin Critical; Major aceptables o ausentes; verify adecuado |
| REQUEST CHANGES | Critical o Major sin resolver |
| NEEDS DISCUSSION | Ambiguedad producto/arquitectura; Operador debe decidir |

## Salida obligatoria

```
Veredicto: APPROVE | REQUEST CHANGES | NEEDS DISCUSSION
Resumen (2-3 frases)
Alcance revisado (commits, archivos, lineas aprox)
Hallazgos
  Critical: [archivo:linea] problema → sugerencia
  Major: ...
  Minor: ...
  Questions: ...
Aspectos correctos (breve, especifico)
Verify observado o faltante
Siguiente paso sugerido
```

## Diff grande

| Tamano | Estrategia |
|--------|------------|
| >500 lineas | Revisar por commit o modulo; declarar cobertura parcial |
| Generado | Enfocar en hand-written y contratos |
| Mix refactor+feature | Pedir split o revisar por intencion separada |

## Integracion

| Skill | Relacion |
|-------|----------|
| commit-prepare | Review antes de empaquetar commit |
| git-workflow | Review antes de PR |
| secure-by-default | Escalar hallazgos de seguridad |
| meaningful-tests | Señalar huecos de regresion |
| split-to-prs (nativa) | PR demasiado grande |

## Prohibiciones

- APPROVE sin leer diff.
- Nitpicks masivos fuera de guia del repo.
- Imponer patron ajeno al codebase (R1).
- Confundir preferencia estetica con Major.
