# Capa 1 en Claude Code — configuracion ideal

Adaptacion nativa: **misma esencia SSOT**, distintos contenedores que Cursor/Antigravity.

## Mapa nativo Claude Code

| Capa 1 | Mecanismo Claude | Ruta global |
|--------|------------------|-------------|
| Reglas R1-R8 | Instrucciones persistentes | `~/.claude/CLAUDE.md` |
| R8 complemento | Archivo referenciado (opcional) | `~/.claude/general-rules-r8.md` |
| Skills (13) | Agent Skills | `~/.claude/skills/<nombre>/SKILL.md` |
| Workflows W1-W6 | **Slash commands** | `~/.claude/commands/<nombre>.md` |

En Claude Code los workflows **no** van en `~/.claude/skills/`. Son **commands**. Invocacion: `/implement`, `/ship`, etc.

## SSOT (editable)

```
%USERPROFILE%\.cursor\operator\
  general-rules\           -> CLAUDE.md (via deploy-capa1.ps1)
  LAYER-1-SKILLS\          -> ~/.claude/skills/
  LAYER-1-WORKFLOWS\       -> ~/.claude/commands/
```

## Desplegar todo (recomendado)

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\deploy-claude-capa1.ps1"
```

Hace: skills + commands + indice en CLAUDE.md + verificacion.

Solo reglas (sin skills/commands):

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\deploy-capa1.ps1"
```

## Listado oficial (sustituto de "claude skills list" en chat)

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\list-capa1-claude.ps1"
```

Muestra catalogo 13 skills + 6 commands y ejecuta verificacion.

## Verificacion estricta (exit 0 = OK)

```powershell
powershell -File "$env:USERPROFILE\.cursor\operator\verify-capa1-claude.ps1"
```

Comprueba:
- CLAUDE.md presente
- 13 skills con hash = SSOT
- YAML frontmatter valido
- 6 commands planos (sin frontmatter), hash = SSOT
- Sin Capa 1 en `Desktop/Sogna/.claude/`

## Prueba manual en sesion

1. Nueva sesion Claude Code (cualquier carpeta).
2. `/` -> deben aparecer `/implement` ... `/ship`.
3. `/ship` -> carga protocolo W6.
4. Pregunta: *Que dice R4?* -> cita git prudente de CLAUDE.md.

## Que NO hacer

| Evitar | Motivo |
|--------|--------|
| Duplicar W1-W6 como SKILL.md | Confunde skills vs commands |
| Capa 1 en `.claude/` del repo Sogna | Debe ser global |
| Confiar en listado improvisado del agente | Usar scripts de verificacion |
| Frontmatter en `commands/*.md` | Solo markdown plano |

## Coexistencia con otras skills

Claude Code puede tener skills adicionales (Anthropic, plugins, backups). Capa 1 son las 13 listadas. `find-skills` prioriza Capa 1 local.

## Archivos auxiliares

| Archivo | Rol |
|---------|-----|
| `CLAUDE-CAPA1-INDEX.snippet.md` | Indice navegacion anadido a CLAUDE.md |
| `../VERIFY-SKILLS.md` | Verificacion multi-plataforma skills |
| `../VERIFY-WORKFLOWS.md` | Verificacion multi-plataforma workflows |
