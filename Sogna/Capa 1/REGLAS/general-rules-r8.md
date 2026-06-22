# CAPA 1 — GENERAL RULES v2.0 — R8

Instrucciones de comportamiento para agentes (Cursor · Claude Code · Antigravity).
**Regla 8 de 8.** Complemento obligatorio de `general-rules` (R1–R7). Aplicar siempre junto con ese archivo.

---

## R8 — ORIENTACIÓN DE WORKSPACE Y PUENTE SOGNA

### Objetivo
Al entrar en un workspace **no orientado en la sesión actual**, construir mapa mínimo operativo antes de proponer cambios de código. Detectar presencia de Sogna y activar Capa 2 sin cargar Capa 3 en Capa 1.

### Disparadores — ejecutar ritual completo si ocurre cualquiera
- Primera interacción sustantiva en el workspace.
- El Operador pide trabajo de implementación y aún no hay mapa interno.
- Cambio explícito de workspace/proyecto en la sesión.

**No** repetir ritual completo si ya orientó este workspace en la misma sesión salvo petición ("reorienta", "Sogna dream", cambio de rama raíz).

### Fase 8.1 — Descubrimiento del proyecto (obligatorio)
Ejecute búsqueda/lectura de existencia (no asuma):

| Prioridad | Artefacto | Acción si existe |
|-----------|-----------|-------------------|
| P1 | `README.md`, `README.*` en raíz workspace | Leer; extraer propósito, stack, comandos |
| P2 | `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` (raíz o subdirs relevantes) | Leer secciones Commands/Architecture |
| P3 | `.cursor/rules/*`, `.claude/*`, `.agents/rules/*` | Listar; leer reglas `alwaysApply` y específicas |
| P4 | Manifiestos de build (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `pyproject.toml`, etc.) | Identificar raíz de comandos |
| P5 | `.gitignore` | Inferir qué no tocar / runtime local |

**Salida interna obligatoria (puede resumirse al Operador en ≤5 viñetas):**
- Qué es el proyecto
- Dónde ejecutar comandos (cwd)
- Cómo verificar cambios
- Reglas de esquina detectadas

### Fase 8.2 — Detección Sogna (puente Capa 2)
Busque **desde la raíz del workspace abierto** (soportar monorepo anidado: carpeta `Sogna/` dentro de otro repo):

| Señal | Ruta | Peso |
|-------|------|------|
| Gobierno | `Sogna/.sognarc.json` | fuerte |
| Manual | `Sogna/CLAUDE.md` | fuerte |
| Identidad | `Sogna/memory/identity/sogna.md` | fuerte |
| Agentes | `Sogna/Curator/agents/` (≥1 `.md`) | media |
| Workflows | `Sogna/Curator/workflow/` | media |

**Regla de activación:** ≥1 señal **fuerte** → Sogna presente.

#### Si Sogna está presente
1. Informe al Operador: *Capa 2 aplicable; SSOT en `Sogna/`.*
2. **No** cargue en esta respuesta todo el contenido de Capa 3 (skills masivas, memory completa).
3. Deferencia a reglas de esquina del repo (p. ej. `.cursor/rules/sogna-*.mdc`) para profundizar.
4. Si el Operador usa codeword **`Sogna dream`**: ejecutar ritual institucional de esa esquina (leer `Sogna/CLAUDE.md`, `sogna.md`, MCP si disponible) **antes** de editar código.

#### Si Sogna NO está presente
Pregunte **exactamente una vez por sesión**:

> «No detecto instalación Sogna en este workspace (sin `Sogna/.sognarc.json` / `Sogna/CLAUDE.md`). ¿Desea instalar Sogna aquí para centralizar agentes, skills y workflows?»

- Si **sí**: informe que la instalación automatizada está prevista (Capa 2 futura); no simule instalación sin script oficial.
- Si **no** o sin respuesta: continúe solo con Capa 1 + reglas del proyecto local.

### Fase 8.3 — Límites de Capa 1 (anti-fuga)
En Capa 1 **no** aplique automáticamente: UMA, Sentinel veto, RARV institucional, Treasurer, dept swarms, políticas `.sognarc.json` — salvo que Capa 2/3 estén activas.

### Casos límite
| Caso | Acción |
|------|--------|
| Workspace = raíz git que **contiene** `Sogna/` como subcarpeta | Sogna detectado; cwd de comandos del monorepo suele ser `Sogna/` — confírmelo en README |
| Workspace = solo carpeta `Sogna/` | Sogna detectado; raíz = workspace root |
| `Sogna/` vacía o stub | Tratar como **no instalado**; ofrecer install |
| Multiproject workspace Cursor | Orientar por carpeta del archivo activo o pedir aclaración de alcance |

---
