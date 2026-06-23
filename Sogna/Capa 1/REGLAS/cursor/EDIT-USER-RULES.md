# Capa 1 — Cómo editar GENERAL RULES en Cursor

User Rules se sincronizan con la **nube de Cursor**. El error *Failed to save changes* suele ser sync/red, no el contenido.

## Fuente de verdad (siempre editable)

```
%USERPROFILE%\.cursor\operator\LAYER-1-RULES.md
```

## Flujo de actualización

1. Edite `LAYER-1-RULES.md` (cualquier editor).
2. Ejecute:
   ```powershell
   & "$env:USERPROFILE\.cursor\operator\sync-layer1-rules.ps1"
   ```
   (Regenera Claude/Antigravity y copia al portapapeles.)
3. En Cursor: **Settings → Rules → User**
   - Borre la regla General Rules antigua.
   - **+ Add rule** → pegue (Ctrl+V) → guarde.

## Si el guardado sigue fallando

1. Cierre y abra Cursor; o **Log out / Log in** (Settings).
2. **Settings → Network → Run Diagnostics**.
3. **Settings → HTTP/2 → Disable HTTP/2** (workaround conocido).
4. Desactive VPN/proxy temporalmente.

## Plan B — regla corta en User (pointer)

Si la nube no acepta ~15 KB, use una sola User Rule corta:

```
Al inicio de cada sesión, lea y aplique %USERPROFILE%\.cursor\operator\LAYER-1-RULES.md con la herramienta Read. Es Capa 1 (GENERAL RULES); prevalece salvo Capa 2/3 del proyecto.
```

El SSOT completo sigue en disco; Cursor lo lee bajo demanda.

## Claude Code / Antigravity

`sync-layer1-rules.ps1` también actualiza:

- `%USERPROFILE%\.claude\CLAUDE.md`
- `%USERPROFILE%\.agents\rules\general-rules.md`
