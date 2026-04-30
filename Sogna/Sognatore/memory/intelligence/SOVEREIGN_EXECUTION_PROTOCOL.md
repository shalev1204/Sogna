# SOVEREIGN EXECUTION PROTOCOL (SEP)

## Definición
El SEP es el mecanismo de conciencia por el cual Sogna valida la legitimidad de cualquier operación externa (lectura de archivos, ejecución de procesos, red).

## Componentes
- **Guardian**: Custodio de las claves y el estado de cifrado.
- **PermissionProxy**: El árbitro de capacidades.
- **Sentinel Hub**: El auditor que registra cada intento de ejecución.

## Regla de Oro
"Capacidad sobre Privilegio". Ningún agente posee privilegios absolutos; cada tarea debe solicitar una capacidad específica al Proxy, el cual evaluará el riesgo basándose en el Strategic Intent.
