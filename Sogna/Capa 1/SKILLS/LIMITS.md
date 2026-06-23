# Capa 1 Skills — Limites por plataforma (junio 2026)

Investigacion para 12 skills globales (formato Agent Skills / SKILL.md).

## Resumen ejecutivo

| Plataforma | Limite duro en SKILL.md | Limite critico real | Donde vive global |
|------------|-------------------------|---------------------|-------------------|
| Cursor | name 64, description 1024 | SKILL.md ~500 lineas recomendado; cuerpo sin cap estricto | `~/.cursor/skills/` |
| Claude Code | name 64, description 1024 | description+when_to_use 1536 chars en listado; budget total ~8000 chars (12 skills OK) | `~/.claude/skills/` |
| Antigravity | name 64, description 1024 | Misma anatomia SKILL.md; rules distintas (12k) | `~/.agents/skills/` |

No existe limite de 12.000 caracteres por skill (eso aplica a Rules/GEMINI.md en Antigravity, no a skills).

## Cursor

- Directorios: `~/.cursor/skills/<name>/SKILL.md` (global) o `.cursor/skills/` (proyecto).
- Tambien lee `~/.agents/skills/` y `~/.claude/skills/` por compatibilidad.
- Frontmatter: `name` (obligatorio, = nombre carpeta), `description` (obligatorio, max 1024).
- Opcional: `paths`, `disable-model-invocation`, `metadata`.
- Cuerpo: cargado bajo demanda; recomendacion oficial ~500 lineas max.
- Progressive disclosure: detalle en `references/`, `scripts/`.

## Claude Code

- Directorio global: `~/.claude/skills/<name>/SKILL.md`.
- Listado en sesion: description + when_to_use truncados a 1536 chars por skill.
- Budget total metadata de todas las skills: ~1% context window (fallback ~8000 chars).
- Con 12 skills y descriptions ~150-250 chars: cabe sin problema.
- Cuerpo SKILL.md: bajo demanda al invocar; mantener <500 lineas.
- Ajuste opcional: `skillListingBudgetFraction` en settings.json si crece el catalogo.

## Antigravity 2.0 + IDE

- Skills: carpeta `~/.agents/skills/<name>/SKILL.md` (global) o `<workspace>/.agents/skills/`.
- Mismo estandar Agent Skills (name, description, cuerpo markdown).
- Rules globales: `~/.gemini/GEMINI.md` max 12.000 chars (no confundir con skills).
- Workflows: max 12.000 chars cada uno (archivo aparte).
- Recomendacion comunidad: 10-30 skills optimo; 12 es ideal.

## Diseno Capa 1 (12 skills) — v2 expandido

| Metrica | Target v2 | Limite duro |
|---------|-----------|-------------|
| description por skill | 400-550 chars (WHAT + WHEN + exclusiones) | 1024 |
| budget total descriptions | 5000-7000 chars (12 skills) | ~8000 Claude |
| cuerpo por skill | 130-200 lineas densas | ~500 recomendado |
| total catalogo cuerpo | ~1800-2400 lineas | sin cap estricto |
| estilo | Prosa compacta tipo reglas; tablas operativas; sin negritas decorativas | — |
| nombre carpeta | = `name` en frontmatter (kebab-case) | 64 |

## Dos esquemas de despliegue (mismo contenido)

```
~/.cursor/skills/<name>/SKILL.md
~/.claude/skills/<name>/SKILL.md
~/.agents/skills/<name>/SKILL.md
```

SSOT editable: `%USERPROFILE%\.cursor\operator\LAYER-1-SKILLS\<name>\SKILL.md`

## No duplicar (skills nativas Cursor)

Mantener fuera de Capa 1: create-rule, create-skill, review-bugbot, review-security, canvas, sdk, split-to-prs.
