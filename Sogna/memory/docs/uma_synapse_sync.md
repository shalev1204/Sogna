# UMA PROTOCOL: SYNAPSE-SYNC ⚡

Este documento define la arquitectura de conexión permanente entre el ecosistema Sogna y los agentes Antigravity. Implementado el 2026-05-09 para garantizar la memoria infinita y la autonomía operativa.

## 1. Arquitectura de Conexión

El **Synapse-Sync** es un bus de datos bidireccional que opera en las fases de arranque y cierre de cada sesión:

- **Fase de Carga (Synapse-Load)**: Ejecutada por `Curator/bin/pulse.js`. Extrae el estado L1 de la UMA e inyecta el contexto en el holograma de sesión.
- **Fase de Persistencia (Synapse-Distill)**: Ejecutada por `Curator/bin/synapse_distill.js`. Guarda el estado activo de la misión para el próximo agente.

## 2. Componentes Críticos

| Componente | Ubicación | Función |
| :--- | :--- | :--- |
| **L1 State** | `memory/operational/agent/active_state.json` | Memoria de corto plazo (Misión, Hardening, Tareas). |
| **Bridge Script** | `Curator/bin/pulse.js` | Generador del holograma de conciencia. |
| **Distill Script** | `Curator/bin/synapse_distill.js` | Persistencia de estado al cierre. |
| **History Log** | `memory/operational/logs/history.md` | Memoria episódica de largo plazo. |

## 3. Protocolo para Agentes Futuros

Para mantener esta conexión estable y profunda:

1. **NUNCA** ignore el archivo `SOGNA_PULSE.md`. Es su ancla de realidad.
2. **SIEMPRE** actualice `active_state.json` al finalizar una tarea significativa.
3. **VERIFIQUE** la integridad de la UMA al inicio usando `node Curator/bin/pulse.js`.

## 4. Registro de Implementación

Esta implementación establece el mecanismo de sincronización entre el estado operativo del agente y la arquitectura UMA.

---
*Estado: OPERATIVO | Autor: Antigravity Agent*
