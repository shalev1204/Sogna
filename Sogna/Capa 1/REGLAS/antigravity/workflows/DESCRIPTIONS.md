# Antigravity — Descripciones UI para workflows Capa 1 (6)

Pegar en Customizations → Workflows → +Global.

Ruta disco oficial (auto via script):
- `~/.gemini/config/workflows/*.md` (primaria, paridad skills)
- `~/.gemini/antigravity/global_workflows/*.md` (compat)

Guia completa: `deploy/antigravity/workflows/README-ANTIGRAVITY-WORKFLOWS.md`

Limite cuerpo: 12.000 caracteres. Target SSOT v2: 6000–9500 chars.

## implement (W1)

Nombre: `implement`

Description:
```
Implementa feature con plan, gate OK del Operador y verify con evidencia. Usar con /implement o cuando pidan implementar, desarrollar funcionalidad, anadir feature. Orquesta plan-before-build y meaningful-tests.
```

Command: copiar `implement.md` completo.

## fix-bug (W2)

Nombre: `fix-bug`

Description:
```
Corrige bug con reproduccion, causa raiz, fix minimo y regresion. Usar con /fix-bug o cuando reporten error, test rojo, no funciona, falla CI. Orquesta systematic-debug.
```

Command: copiar `fix-bug.md` completo.

## review (W3)

Nombre: `review`

Description:
```
Revision pre-merge con checklist y veredicto APPROVE o REQUEST CHANGES. Usar con /review o antes de PR, revisa cambios, pre-merge. Orquesta code-review y secure-by-default si aplica.
```

Command: copiar `review.md` completo.

## explore (W4)

Nombre: `explore`

Description:
```
Explora repo desconocido y entrega mapa operativo con respuesta concreta. Usar con /explore o repo nuevo, como esta organizado, donde esta X. Solo lectura. Orquesta explore-codebase.
```

Command: copiar `explore.md` completo.

## refactor (W5)

Nombre: `refactor`

Description:
```
Refactor seguro sin cambiar comportamiento: baseline verify, pasos atomicos, verify intermedio. Usar con /refactor o extraer modulo, renombrar, limpiar deuda estructural. Orquesta safe-refactor.
```

Command: copiar `refactor.md` completo.

## ship (W6)

Nombre: `ship`

Description:
```
Cierra trabajo: auto-review ligera, verify, commit y PR si el Operador lo pide. Usar con /ship o commitea, abre PR, verify y ship. Orquesta commit-prepare y git-workflow. No commit sin mandato.
```

Command: copiar `ship.md` completo.

## Verificacion tamano

```powershell
Get-ChildItem "$env:USERPROFILE\.cursor\operator\LAYER-1-WORKFLOWS\*.md" |
  Where-Object { $_.Name -notmatch 'LIMITS|README' } |
  ForEach-Object { [PSCustomObject]@{ Name=$_.Name; Chars=(Get-Content $_.FullName -Raw).Length } }
```

Todos deben ser <= 12000.

## Cadena SDLC (referencia UI)

explore → implement | fix-bug | refactor → review (opcional) → ship
