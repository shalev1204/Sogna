---
description: "Capa 2 Sogna — exclusiones de busqueda e indexado (Antigravity no carga .antigravityignore)"
---
# Capa 2 — Exclusiones indexado (Antigravity)

**Hecho de plataforma:** Antigravity no busca ni aplica un archivo `.antigravityignore` en `grep_search`, `list_dir` ni indexado automatico. Esta regla **sustituye** ese mecanismo inexistente.

## Obligaciones del agente

1. **Respetar** `.gitignore` del workspace en lecturas y busquedas amplias.
2. **Respetar** `.rgignore` cuando la herramienta subyacente (ripgrep/git) lo soporte.
3. **Filtrar manualmente** si la herramienta no excluye sola: usar exclusiones tipo `!**/ruta/**` alineadas con `.rgignore`.
4. **SSOT patrones Cursor/Claude:** `{sogna_root}/Curator/corners/ignores/ai-index.host` o `ai-index.monorepo` (mismo contenido que `.cursorignore` / `.claudeignore`).

## Tier 1 — no leer ni commitear

`.env`, `.env.*` (excepto `.env.example`), `*.pem`, `*.key`, vault, `credentials/`, `**/secrets/`.

## Tier 2 — omitir en busquedas e index masivo

`node_modules/`, `dist/`, `build/`, `.turbo/`, `coverage/`, `*.log`, `*.sqlite3`, etc. (lista completa en `.rgignore`).

## Tier 3 — Capa 3 anti-fuga (no cargar sin mandato)

Patrones relativos a `{sogna_root}` resuelto en Bridge:

- `CLAUDE.md`, `memory/identity/sogna.md`, `memory/archive/**`
- `Sognatore/resources/skills/**` (manuales SKILL, AGENTS, CLAUDE)
- `Predatore/CLAUDE.md`, `Sentinel/CLAUDE.md`, `engines/**/CLAUDE.md`
- `Curator/skills/**`
- `Sentinel/data/signatures.json`
- `memory/intelligence/episodic/snapshot_*.json`
- `memory/operational/vectors/**`

Cargar con `@`, ritual `Sogna dream` o tarea concreta del Operador.
