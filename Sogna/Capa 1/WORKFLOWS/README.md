# Capa 1 — Workflows globales (SSOT)

6 workflows universales (sin contenido Sogna). Invocacion explicita con `/`. Numero par por diseno: ciclo SDLC completo.

| ID | Archivo | Slash | Proposito |
|----|---------|-------|-----------|
| W1 | implement.md | /implement | Implementar feature con plan y gate |
| W2 | fix-bug.md | /fix-bug | Corregir bug sistematicamente |
| W3 | review.md | /review | Revisar cambios pre-merge |
| W4 | explore.md | /explore | Explorar codebase desconocido |
| W5 | refactor.md | /refactor | Refactor seguro sin cambio comportamiento |
| W6 | ship.md | /ship | Verify, commit y PR |

## Cadena SDLC

```
W4 explore (opcional)
  → W1 implement | W2 fix-bug | W5 refactor
  → W3 review (opcional)
  → W6 ship
```

Limites por plataforma: `LIMITS.md`.

Descripciones Antigravity UI: `deploy/antigravity/workflows/DESCRIPTIONS.md`.

Deploy: `deploy-workflows-capa1.ps1` desde `%USERPROFILE%\.cursor\operator\`.

Relacion skills: cada workflow referencia skills Capa 1 (G1-G12); no duplica su protocolo interno.
