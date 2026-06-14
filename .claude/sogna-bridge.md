# Capa 2 — Sogna Bridge (Claude Code)

Regla **obligatoria** de puente. Complemento de `.claude/sogna-ecosystem.md`. **Capa 1** (GENERAL RULES R1–R8) vive en `~/.claude/CLAUDE.md` y skills/commands globales; no se duplica aquí.

## 1. Precedencia

1. **Capa 3** — contenido bajo `sogna_root/` (`CLAUDE.md`, `memory/`, `Curator/`, `.sognarc.json`)
2. **Capa 2** — este archivo + `sogna-ecosystem.md`
3. **Capa 1** — reglas globales del Operador

Ante conflicto: gana la capa superior. No improvise excepciones.

## 2. Leer manifest (obligatorio una vez por sesión)

Localice y lea **`platform.manifest.json`**:

| Modo workspace | Ruta del manifest |
|----------------|-------------------|
| **Embedded** (repo padre + subcarpeta `Sogna/`) | `Sogna/platform.manifest.json` |
| **Monorepo** (workspace = raíz Sogna) | `platform.manifest.json` |

Si ninguna ruta existe → **Capa 2 inactiva**; opere solo Capa 1 + reglas locales. Pregunte **una vez** si desea instalar Sogna (`Sogna/scripts/install-corners-host.ps1`).

## 3. Resolución de rutas (sin suposiciones)

Determine `sogna_root` y `command_cwd`:

```
SI existe Sogna/platform.manifest.json desde workspace root:
  sogna_root = "Sogna"
  command_cwd = "Sogna"
  corners_at = "."

SI existe platform.manifest.json en workspace root (monorepo):
  sogna_root = "."
  command_cwd = "."
  corners_at = "."
```

**Paths SSOT del manifest** son relativos a `sogna_root`. Manual Capa 3 embedded: `Sogna/CLAUDE.md`; monorepo: `CLAUDE.md`.

**Esquinas Capa 2:** `.claude/sogna-bridge.md` + `.claude/sogna-ecosystem.md` en `corners_at`. Si workspace = solo `Sogna/`, use `Sogna/.claude/` (copia desplegada).

**Settings locales:** `.claude/settings.local.json` en git root — gitignored; permisos locales del Operador.

## 4. Detección de instalación Sogna

Desde `sogna_root`, compruebe señales (**≥1 strong → Sogna activo**):

| Señal | Ruta (relativa a sogna_root) | Peso |
|-------|------------------------------|------|
| Gobierno | `.sognarc.json` | strong |
| Manual | `CLAUDE.md` | strong |
| Identidad | `memory/identity/sogna.md` | strong |
| Agentes | `Curator/agents/` | medium |

**Activado:** Capa 2 + puente Capa 3. **No** vuelque Capa 3 completa en respuestas iniciales.

## 5. Anti-fuga Capa 3

Hasta confirmación de tarea o **`Sogna dream`**, **NO**:

- Cargar catálogo masivo `Sognatore/resources/skills/`
- Leer/borrar `memory/archive/` sin mandato
- Aplicar Sentinel/RARV/`.sognarc.json` en detalle sin tarea acotada
- Duplicar manuales largos en chat

## 6. Disparadores de orientación completa

Ritual en `sogna-ecosystem.md` si:

- Primera interacción sustantiva
- Operador escribe **`Sogna dream`**
- Implementación sin mapa interno
- Cambio de workspace en sesión

## 7. Instalación en otro repo

```powershell
powershell -File Sogna/scripts/install-corners-host.ps1
```

SSOT: `{sogna_root}/Curator/corners/claude/`. Actualice SSOT en `Curator/corners/` antes de editar copias en `.claude/`.

## 8. Prohibiciones Capa 2

- No copiar Capa 1 al repo
- No reemplazar manual Capa 3 con estos archivos
- No asumir MCP activo
- No cambiar `command_cwd` sin confirmación
