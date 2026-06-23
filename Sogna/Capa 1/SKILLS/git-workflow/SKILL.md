---
name: git-workflow
description: "Flujo git profesional: branches, commits atomicos, mensajes, PRs, resolucion conflictos, merge squash rebase. Usar al crear PR, redactar commit message, resolver conflictos, elegir estrategia integracion, interpretar git status, recuperar estado confuso. R4: no commit push ni --no-verify salvo orden explicita Operador. Complementa commit-prepare y code-review. No force push main master."
---
# Git workflow

Objetivo: guiar operaciones git, texto de commits y PRs con estandar profesional mientras el Operador conserva control del historial remoto (R4). El agente prepara y redacta; publica solo bajo mandato explicito.

## Disparadores

| Situacion | Entregable |
|-----------|------------|
| Pull request | Titulo, body, test plan |
| Commit message | Formato repo + cuerpo por que |
| Conflictos merge/rebase | Resolucion + verify |
| Estrategia integracion | Recomendacion merge/squash/rebase |
| Estado confuso | Diagnostico; comandos no destructivos |
| Branch naming | Propuesta antes de crear |

## Invariantes R4

| Prohibido salvo orden textual explicita | Detalle |
|----------------------------------------|---------|
| git commit | Operador o peticion literal |
| git push, gh pr create | Idem |
| --no-verify, --no-gpg-sign | Hook fallido = fix, no bypass |
| force push main/master/develop | Avisar riesgo |
| reset --hard, clean -fd | Explicar perdida datos |

## Principios

1. Commits atomicos: un proposito; revertible aisladamente.
2. Mensaje explica por que; diff muestra que.
3. PR reviewable: tamano razonable; titulo escaneable.
4. Historia compartida: no reescribir sin acuerdo.
5. Stage selectivo: paths del alcance; no git add . ciego.

## Commits

### Formato

```
tipo(alcance): resumen imperativo presente, max 72 chars

Cuerpo opcional: contexto, motivacion, breaking change, refs issue.
```

Adaptar a Conventional Commits del repo si existe historial.

### Tipos

| Tipo | Uso |
|------|-----|
| feat | Comportamiento nuevo |
| fix | Bugfix |
| refactor | Sin cambio comportamiento |
| docs | Solo documentacion |
| test | Solo tests |
| chore | Tooling, deps patch |
| perf | Mejora medida |

### Calidad mensaje

| Mal | Bien |
|-----|------|
| fix stuff | fix(auth): reject expired refresh tokens in middleware |
| WIP | (no commit WIP salvo acuerdo) |
| parrafos vacios sin por que | Explicar decision si no obvia en diff |

## Pull request

### Plantilla

```
## Summary
- Cambio y motivacion (bullets)

## Test plan
- [ ] comando verificado

## Notas
- Riesgos, flags, migraciones, rollback
```

### Titulo PR

Igual espiritu que commit: escaneable en lista PRs.

## Conflictos

| Paso | Accion |
|------|--------|
| 1 | git fetch; entender ramas divergentes |
| 2 | git log --oneline --graph ambas ramas |
| 3 | Abrir archivos conflicto; entender ours/theirs |
| 4 | Resolver preservando intencion de ambos cambios |
| 5 | check/test paquete (R3) |
| 6 | Continuar merge/rebase |

No marcar resuelto si no compila.

## Estrategias integracion

| Estrategia | Cuando | Historial |
|------------|--------|-----------|
| Merge commit | Feature branch larga; preservar commits | Ramificado |
| Squash | Muchos commits ruidosos; una unidad logica | Lineal en main |
| Rebase | Equipo prefiere lineal; rama no compartida | Lineal |
| Rebase + merge | Politica GitLab/GitHub | Lineal |

No rebase rama que otros ya pullaron sin coordinacion.

## Ramas (propuesta)

| Patron | Ejemplo |
|--------|---------|
| feature/ | feature/oauth-login |
| fix/ | fix/null-user-crash |
| chore/ | chore/bump-deps |

Confirmar convencion del repo antes de proponer.

## Recuperacion no destructiva

| Problema | Comando orientativo |
|----------|---------------------|
| Stage incorrecto | git restore --staged |
| Cambios locales no deseados | git restore archivo |
| Commit local no pusheado mal | git reset --soft HEAD~1 (solo con OK) |
| Ver reflog | git reflog |

Destructivos: explicar riesgo; esperar OK.

## Salida obligatoria

```
Situacion git interpretada
Accion recomendada
Texto commit o PR (copy-paste)
Comandos sugeridos con explicacion breve
Riesgos si aplica
```

## Integracion

| Skill | Relacion |
|-------|----------|
| commit-prepare | Antes del commit propiamente |
| code-review | Antes del PR |
| split-to-prs (nativa) | PR demasiado grande |
| systematic-debug | Bisect y regresion |

## Prohibiciones

- push o commit sin mandato (R4).
- Bypass hooks (R4).
- force push silencioso a ramas compartidas.
- PR sin test plan cuando hay logica cambiada.
