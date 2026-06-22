# Scripts Capa 1 — portabilidad

| Script | Uso |
|--------|-----|
| `instalar-capa1-completa.ps1` | **Instalar** Capa 1 en equipo nuevo (reglas disco + 13 skills + 6 workflows) |
| `verificar-capa1.ps1` | **Verificar** instalación |

```powershell
powershell -ExecutionPolicy Bypass -File "Sogna\Capa 1\scripts\instalar-capa1-completa.ps1"
powershell -File "Sogna\Capa 1\scripts\verificar-capa1.ps1"
```

Cursor User Rules y Antigravity UI workflows pueden requerir pegado manual (ver `../README.md`).
