---
description: "Capa 2 Sogna — detección, manifest, resolución de rutas, activación Capa 3 y anti-fuga. Par con sogna-ecosystem."
---
# Capa 2 — Sogna Bridge (Antigravity)

Regla **obligatoria** de puente. Complemento de `sogna-ecosystem.md`. **Capa 1** (GENERAL RULES) vive en reglas globales Antigravity (`~/.gemini/GEMINI.md`); no se duplica aquí.

## 1. Precedencia

1. **Capa 3** — contenido bajo `sogna_root/` (`CLAUDE.md`, `memory/`, `Curator/`, `.sognarc.json`)
2. **Capa 2** — este archivo + `sogna-ecosystem.md`
3. **Capa 1** — reglas globales del Operador

Ante conflicto: gana la capa superior.

## 2. Leer manifest (obligatorio una vez por sesión)

Lea **`platform.manifest.json`**:

| Modo workspace | Ruta del manifest |
|----------------|-------------------|
| **Embedded** | `Sogna/platform.manifest.json` |
| **Monorepo** | `platform.manifest.json` |

Si no existe → Capa 2 inactiva; Capa 1 solamente. Pregunte **una vez** por instalación (`Sogna/scripts/install-corners-host.ps1`).

## 3. Resolución de rutas

```
SI Sogna/platform.manifest.json existe desde workspace root:
  sogna_root = "Sogna"
  command_cwd = "Sogna"
  corners_at = "."

SI platform.manifest.json en workspace root:
  sogna_root = "."
  command_cwd = "."
  corners_at = "."
```

Paths SSOT del manifest → relativos a `sogna_root`.

**Esquinas Capa 2:** `.agents/rules/sogna-bridge.md` + `sogna-ecosystem.md`. Workspace solo `Sogna/` → use `Sogna/.agents/rules/`.

## 4. Detección Sogna

Desde `sogna_root`, compruebe señales (**≥1 strong → Sogna activo**):

| Señal | Ruta (relativa a sogna_root) | Peso |
|-------|------------------------------|------|
| Gobierno | `.sognarc.json` | strong |
| Manual | `CLAUDE.md` | strong |
| Identidad | `memory/identity/sogna.md` | strong |
| Agentes | `Curator/agents/` | medium |
| Esquinas SSOT | `Curator/corners/` | medium |

**Activado:** Capa 2 + puente Capa 3. **No** vuelque Capa 3 completa en respuestas iniciales.

## 5. Anti-fuga Capa 3

Hasta confirmación de tarea o **`Sogna dream`**, **NO**:

- Cargar catálogo masivo `Sognatore/resources/skills/`
- Leer/borrar `memory/archive/` sin mandato
- Aplicar Sentinel/RARV/`.sognarc.json` en detalle sin tarea acotada
- Duplicar manuales largos en chat

## 6. Disparadores de orientación completa

Ritual en `sogna-ecosystem.md` si:

- Primera interacción sustantiva en el workspace
- Operador escribe **`Sogna dream`**
- Implementación sin mapa interno
- Cambio de workspace/proyecto en la sesión

**No** repetir ritual completo si ya orientó este workspace en la misma sesión salvo petición ("reorienta", "Sogna dream").

## 7. Instalación en otro repo (plantilla)

SSOT Capa 2: `{sogna_root}/Curator/corners/`. Para host repo con carpeta `Sogna/`:

```powershell
powershell -File Sogna/scripts/install-corners-host.ps1
```

Copia esquinas a la raíz git del host. **No** modifique manualmente sin actualizar SSOT en `Curator/corners/`.

## 8. Prohibiciones Capa 2

- No copiar R1–R8 ni skills/workflows Capa 1 al repo
- No sustituir manual Capa 3 (`CLAUDE.md`) con estas reglas
- No asumir UMA MCP/Sognatore activos (comprobar; si fallan, declarar límite)
- No cambiar `command_cwd` sin confirmación del Operador
