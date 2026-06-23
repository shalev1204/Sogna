# Workflow W6 — Ship (verify, commit, PR)

Procedimiento Capa 1 para cerrar trabajo ya implementado: auto-revision ligera, verify final con evidencia, preparacion de commit y PR cuando el Operador lo pida. No implementa features (W1) ni corrige bugs nuevos (W2). Reglas R3, R4, R7.

## Cuando usar este workflow

| Situacion | W6 | Alternativa |
|-----------|-----|-------------|
| Cambios listos; verify + commit + PR | Si | — |
| Operador dice commitea / abre PR / ship | Si | — |
| Aun codificando feature o bugfix | No | W1 o W2 |
| Revision externa formal antes de merge | W3 primero | W3 review |
| Solo pregunta estado git | Respuesta breve | — |
| Working tree limpio | Informar | — |

## Entrada del Operador

| Campo | Obligatorio | Ejemplo |
|-------|-------------|---------|
| Intencion | Si | verify only | commit | PR | commit+PR |
| Alcance | Recomendado | Solo packages/api |
| Mensaje commit | Opcional | fix: null check en login handler |
| Titulo/body PR | Opcional | Operador provee o agente redacta |
| Base branch PR | Opcional | main (default) |

Sin mandato explicito para commit o push: no ejecutar (R4). verify only no implica commit.

## Fases ejecutables

| Fase | Objetivo | Acciones | Skill |
|------|----------|----------|-------|
| 1 | Estado | git status; diff staged/unstaged | git-workflow |
| 2 | Auto-review | Secretos, debug, scope, artefactos | code-review, R5 |
| 3 | Verify | check/test paquete afectado | R3, meaningful-tests |
| 4 | Preparar commit | Mensaje; staging selectivo | commit-prepare |
| 5 | Commit | Solo si Operador pidio commit | commit-prepare, R4 |
| 6 | PR | gh pr create body estructurado | git-workflow |
| 7 | Entrega | Resumen + enlaces | — |

### Fase 1 — Estado

Ejecutar git status. Si hay staged y unstaged mezclados: clarificar que entra en commit. git diff para unstaged; git diff --staged si hay staged.

### Fase 2 — Auto-review ligera

No sustituye W3. Scan rapido del diff: secretos, API keys, .env, tokens; console.log/debug prints; TODO(FIXME) introducidos; archivos generados (dist, lib, node_modules). Si hay Critical: bloquear commit.

### Fase 3 — Verify

Identificar paquete del diff (package.json mas cercano, Cargo.toml, etc.). Ejecutar script check/test documentado. Registrar literal en respuesta. Si falla: detener; sugerir W2.

### Fase 4-5 — Preparar y commit

Seguir skill commit-prepare y regla usuario committing-changes cuando aplique:

1. git status + git diff (+ git log) en paralelo
2. Staging selectivo de archivos relevantes
3. Mensaje 1-2 frases enfoque why, estilo repo
4. Commit con HEREDOC en shell
5. git status post-commit

Prohibido: --no-verify salvo mandato explicito Operador.

### Fase 6 — PR

Si Operador pidio PR o regla creating-pull-requests:

1. git status, diff, tracking branch, git log, git diff base...HEAD
2. Body con Summary + Test plan
3. gh pr create --title ... --body ...
4. Retornar URL

Si branch sin upstream: push -u origin HEAD antes (solo con mandato push).

### Fase 7 — Entrega

Plantilla salida abajo.

## Auto-review checklist (fase 2)

| Check | Accion si falla |
|-------|-----------------|
| .env, keys, tokens, credentials | Bloquear; R5 |
| console.log / dbg! / print debug | Limpiar o pedir OK |
| Archivos no relacionados al objetivo | Unstage; informar |
| node_modules, dist, lib generado, .map | Excluir commit |
| Archivos >500KB binarios sospechosos | Preguntar |
| merge conflict markers | Bloquear |

## Verify (fase 3)

| Paso | Obligatorio |
|------|-------------|
| Inferir paquete/carpeta raiz del diff | Si |
| Usar comando del repo (pnpm check, npm test, etc.) | Si |
| Pegar comando + exit code / resumen | R3 |
| Si multi-paquete: verify cada paquete tocado | Si aplica |

Modo verify only: terminar en fase 3 con informe; no fases 4-6.

## Commit — criterios mensaje

| Bien | Mal |
|------|-----|
| fix: prevent null deref in login when session expired | fixed stuff |
| feat(api): add CSV export endpoint for reports | WIP |
| refactor(auth): extract token validation helper | update |

Seguir convencion del repo si git log muestra otro formato (Conventional Commits, etc.).

## PR body plantilla

```
## Summary
- [bullet 1: que y por que]
- [bullet 2: riesgo o alcance]

## Test plan
- [ ] comando verify ejecutado (+ resultado)
- [ ] caso manual si aplica
- [ ] regresion / edge case
```

## Salida al Operador (fase 7)

```
Intencion ejecutada: verify | commit | PR | commit+PR
Estado git (branch, ahead/behind si relevante)
Auto-review: OK | issues encontrados
Verify: comandos + resultados
Commit: hash + mensaje (si aplica)
PR: URL (si aplica)
Archivos incluidos / excluidos del commit
Pendientes: verify rojo, conflictos, falta W3, push pendiente
```

## Stop conditions

| Condicion | Accion |
|-----------|--------|
| Working tree limpio | Informar; nada que ship |
| Verify falla | Detener antes commit |
| Secretos en diff | Detener; no commit |
| Sin commits para PR | Informar; commit primero |
| Conflictos con base | Documentar; no PR hasta resolver |
| Hook pre-commit falla | Arreglar; nuevo commit (no --no-verify) |

## Anti-patrones

| Evitar | Por que |
|--------|---------|
| commit sin verify | R3 |
| git add . ciego | Incluye basura |
| PR con WIP en titulo sin avisar | Confunde reviewers |
| Push force sin mandato | Destructivo |

## Prohibiciones

- commit o push sin peticion explicita (R4)
- PR con verify no ejecutado o fallido
- Credenciales en mensaje commit o PR body
- --no-verify sin mandato explicito

## Cadena con otros workflows

```
W1 | W2 | W5 → (W3 review opcional) → W6 ship
```

W6 es cierre operativo. Calidad del codigo depende de workflows anteriores. commit-prepare y git-workflow detallan subpasos; W6 los orquesta.

## Invocacion

Operador: `/ship` + verify | commit | PR | commit+PR y detalles opcionales (mensaje, base branch).
