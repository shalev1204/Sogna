# TECHNICAL EXECUTION PROTOCOL (TEP)

## Definición

El TEP es el protocolo de validación por el cual Sogna verifica la legitimidad de cualquier operación externa (lectura de archivos, ejecución de procesos, red).

## Componentes

- **Guardian**: Custodio de las claves y el estado de cifrado.
- **PermissionProxy**: El árbitro de capacidades.
- **Sentinel Hub**: El auditor que registra cada intento de ejecución.

## Regla de Oro

"Capacidad sobre Privilegio". Ningún agente posee privilegios absolutos; cada tarea debe solicitar una capacidad específica al Proxy, el cual evaluará el riesgo basándose en el Strategic Intent.
