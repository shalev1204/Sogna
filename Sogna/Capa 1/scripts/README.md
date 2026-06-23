# Scripts Capa 1 — Portabilidad Multiplataforma

| Script | Propósito | Plataformas | Comando Directo |
|--------|-----------|-------------|-----------------|
| `instalar-capa1-completa.mjs` | **Instalar** Capa 1 (reglas, 13 skills y 6 workflows) | Windows, MacOS, Linux | `node "Capa 1/scripts/instalar-capa1-completa.mjs"` |
| `verificar-capa1.mjs` | **Verificar** integridad y hashes de Capa 1 | Windows, MacOS, Linux | `node "Capa 1/scripts/verificar-capa1.mjs"` |
| `instalar-capa1-completa.ps1` | Instalación legacy (solo PowerShell) | Windows | `powershell -File "Capa 1/scripts/instalar-capa1-completa.ps1"` |
| `verificar-capa1.ps1` | Verificación legacy (solo PowerShell) | Windows | `powershell -File "Capa 1/scripts/verificar-capa1.ps1"` |

## Atajos rápidos del Monorepo (pnpm)

Desde la raíz del monorepo `Sogna/`:

*   **Instalar Capa 1:**
    ```bash
    pnpm capa1:install
    ```
*   **Verificar Capa 1:**
    ```bash
    pnpm capa1:verify
    ```

Cursor User Rules y Antigravity UI workflows pueden requerir pegado manual adicional (ver `../README.md`).
