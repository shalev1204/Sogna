# Antigravity 2.0 + Antigravity IDE — GENERAL RULES (Capa 1)

Documentacion oficial: https://antigravity.google/docs/rules-workflows

## Rutas correctas (junio 2026)

| Alcance | Ruta en disco | Donde en la UI |
|---------|---------------|----------------|
| **Global** (2.0 e IDE) | `%USERPROFILE%\.gemini\GEMINI.md` | Customizations → Rules → **+ Global** |
| **Workspace Sogna** | `Desktop\Sogna\.agents\rules\` | Customizations → Rules → **+ Workspace** |

**Nota:** `%USERPROFILE%\.agents\rules\` NO es la ruta global oficial; Antigravity lee **`~/.gemini/GEMINI.md`**.

Limite por archivo en Antigravity: **12.000 caracteres**. El SSOT completo tiene ~14.900 → usar puntero @ o dos partes.

---

## Opcion A — Global (recomendada, ya desplegada en disco)

Abra `%USERPROFILE%\.gemini\GEMINI.md` o copie desde `deploy\antigravity\PASTE-GLOBAL-POINTER.md`.

Contenido (puntero al SSOT):

```markdown
# CAPA 1 — GENERAL RULES v2.0 (global)

Instrucciones globales del Operador. SSOT completo en disco.

@C:/Users/carle/.cursor/operator/LAYER-1-RULES.md

Si @ no resuelve, lea el archivo anterior con la herramienta Read al inicio de sesion.
Prioridad: Capa 1 salvo Capa 2/3 del proyecto activo.
```

### UI — Antigravity 2.0 e IDE (mismo flujo)

1. Abra Antigravity con carpeta `Desktop\Sogna` (Add Folder).
2. Panel Agent → **⋯** (arriba) → **Customizations** → **Rules**.
3. **+ Global** → pegue `PASTE-GLOBAL-POINTER.md` → activacion **Always On** → guardar.
4. (Opcional workspace) **+ Workspace** → pegue `PASTE-PART1.md` + regla 2 con `PASTE-PART2.md` si @ no carga todo.

---

## Opcion B — Pegar SSOT partido (si @ falla)

| Regla | Archivo | Chars |
|-------|---------|-------|
| Global o Workspace 1 | `PASTE-PART1.md` (R1–R4) | < 12k |
| Global o Workspace 2 | `PASTE-PART2.md` (R5–R8) | < 12k |

Ambas con **Always On**.

---

## Verificacion 100%

```powershell
# Global GEMINI existe
Test-Path "$env:USERPROFILE\.gemini\GEMINI.md"

# Workspace rules
Get-ChildItem "$env:USERPROFILE\Desktop\Sogna\.agents\rules"

# Hash SSOT = general-rules workspace
$h = (Get-FileHash "$env:USERPROFILE\.cursor\operator\LAYER-1-RULES.md").Hash
(Get-FileHash "$env:USERPROFILE\Desktop\Sogna\.agents\rules\general-rules.md").Hash -eq $h
```

En Antigravity (chat nuevo):

- *«Resume R4 sobre git en una frase»* → prohibido commit/push sin orden explicita.
- *«Trato al Operador»* → usted en espanol.

Reinicie Antigravity tras cambiar GEMINI.md.
