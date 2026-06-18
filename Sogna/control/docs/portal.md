# Portal de control — Sogna

## Operador (doble clic)

| Acción | Archivo |
|--------|---------|
| Encender (manual) | `../Encender.bat` |
| Apagar (manual) | `../Apagar.bat` |
| Panel web | `sogna dashboard` o [dashboard](../dashboard/index.html) |

## Automático

- **Sogna_App.vbs** — al iniciar Windows, ejecuta `Sogna.bat on silent` (UMA MCP + Bridge en background).
- Los clientes MCP (Cursor, etc.) se conectan a los puertos residentes sin scripts extra.

## Línea de comandos (`Sogna\control\`)

```bat
Sogna.bat on
Sogna.bat off
Sogna.bat check
Sogna.bat sync
Sogna.bat dashboard
Sogna.bat hologram
```

## Puertos

| Puerto | Servicio |
|--------|----------|
| 8080 | API UMA |
| 8000 | UMA MCP |
| 8001 | MCP Bridge + dashboard |
