---
name: commit-prepare
description: "Empaqueta cambios para commit del Operador: git status, diff limpio, verify R3, mensaje commit copy-paste, stage selectivo, advertencias secretos hooks. Usar al terminar implementacion, prepara commit, mensaje commit, fin sesion con cambios locales, pre-commit hook fallido, o antes de pedir autorizacion commit. R4: agente no commit ni push salvo orden explicita. Integra code-review auto y git-workflow PR posterior."
---
# Commit prepare

Objetivo: entregar paquete completo y honesto para que el Operador decida commit: que cambio, que archivos, que verify corrio, que mensaje usar, que riesgos hay. El agente no escribe historial git sin mandato textual (R4).

Diferencia vs git-workflow: commit-prepare = empaquetar trabajo local listo; git-workflow = PR, remoto, conflictos, estrategia integracion.

## Disparadores

| Situacion | Entregable |
|-----------|------------|
| Implementacion terminada | Resumen + mensaje + verify |
| Fin sesion | Estado diff sin commitear |
| prepara commit / mensaje commit | Paquete copy-paste |
| Hook pre-commit fallo | Diagnostico + fix + re-empaquetar |
| Operador va a commitear manualmente | Checklist pre-commit |

## Invariantes R4

| Regla | Detalle |
|-------|---------|
| No git commit | Salvo peticion textual explicita |
| No git push | Idem |
| No --no-verify | Hook fallido = corregir causa |
| Stage selectivo | Paths alcance; no git add . ciego |
| Excluir stage | .env, secrets, dist, logs masivos, runtime local |

## Principios

1. Diff reviewable: sin accidentales, debug, formateo masivo ajeno (R1).
2. Verify antes proponer commit (R3): check/test paquete afectado.
3. Mensaje al estilo repo: Conventional Commits si aplica.
4. Transparencia: staged vs unstaged; todos los archivos modificados listados.
5. Gate final: preguntar si ejecutar commit; esperar OK.

## Protocolo

### Fase 1 — Inventario

| Comando | Proposito |
|---------|-----------|
| git status | Modified, untracked, staged |
| git diff | Unstaged contenido |
| git diff --staged | Ya staged |

Clasificar cada archivo: intencional / accidental / revisar.

### Fase 2 — Higiene diff

| Rechazar en commit propuesto | Accion |
|------------------------------|--------|
| .env, *.pem, credentials | Excluir; avisar R5 |
| console.log debug | Eliminar |
| TODO no acordados | Eliminar o preguntar |
| Formateo masivo no relacionado | Revertir hunks |
| Artefactos build | gitignore o restore |

Multiples intenciones logicas: sugerir commits separados con mensaje cada uno.

### Fase 3 — Auto-revision rapida

Antes verify final, pasar mentalmente code-review checklist:

| Pregunta | Si no → |
|----------|---------|
| Cumple objetivo Operador? | No proponer listo |
| Secretos en diff? | Bloquear |
| Tests rojos? | Corregir o documentar bloqueo |
| Scope creep? | Recortar o pedir OK |

### Fase 4 — Verificacion R3

| Paso | Accion |
|------|--------|
| 1 | Identificar paquete raiz |
| 2 | Ejecutar check/test documentado |
| 3 | Registrar comando literal y exit code |
| 4 | Si falla: no proponer commit listo salvo WIP declarado |

### Fase 5 — Mensaje commit

Formato (adaptar repo):

```
tipo(alcance): resumen imperativo

Cuerpo: por que del cambio; breaking change si aplica.
```

Un commit = un proposito. Si multiples, listar serie propuesta.

### Fase 6 — Paquete al Operador

Ver salida obligatoria. Incluir comandos:

```
git add path/to/file ...
git commit -m "..."
```

Sin ejecutar salvo OK explicito.

### Fase 7 — Gate

Pregunta: desea que ejecute el commit?
Tras OK: commit con mensaje acordado; hook fallido = fix + commit nuevo, no bypass.

## Salida obligatoria

```
Archivos modificados (staged / unstaged / untracked)
Resumen cambio (2-4 frases)
Auto-revision (OK / observaciones)
Verificacion: comando + resultado
Mensaje commit sugerido (copy-paste)
Comandos git sugeridos
Advertencias: secretos, hooks, archivos grandes, WIP
Estado: LISTO | BLOQUEADO | WIP
```

## Estados

| Estado | Significado |
|--------|-------------|
| LISTO | Verify verde; diff limpio; puede commitear |
| BLOQUEADO | Secretos, tests rojos, objetivo incompleto |
| WIP | Parcial; no presentar como listo |

## Integracion

| Skill | Relacion |
|-------|----------|
| code-review | Auto-revision pre-empaque |
| git-workflow | Tras commit local → PR |
| meaningful-tests | Señalar regresion faltante |
| secure-by-default | Secretos en diff |
| systematic-debug | Si verify falla |

## Condiciones de parada

| Situacion | Accion |
|-----------|--------|
| Secretos en diff | No proponer commit; rotacion R5 |
| Tests rojos | Fix o BLOQUEADO |
| Cambio parcial no acordado | WIP |
| Operador solo pidio mensaje | Omitir ejecutar; entregar texto |

## Prohibiciones

- Ocultar archivos modificados.
- git add . con basura.
- Commit o push sin mandato (R4).
- Afirmar verify verde sin ejecutar (R3).
- --no-verify salvo orden explicita (R4).
