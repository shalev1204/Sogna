# NEURAL ENCRYPTION STANDARD (NES)

## Objetivo

Garantizar que la inteligencia generada por Sogna sea propiedad exclusiva de su operador, protegida contra exfiltración física o lógica.

## Implementación

- **Algoritmo**: AES-256-CBC.
- **Alcance**: `index.json` y fragmentos de memoria `.md` en modo estricto.
- **Gestión de Claves**: El `Guardian` centraliza la rotación y validación de claves.

## Modo Soberanía (Air-Gap)

En presencia de datos altamente sensibles, el NES obliga al uso de proveedores locales (Ollama), cortando cualquier comunicación con APIs externas para prevenir fugas de telemetría.
