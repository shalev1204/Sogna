# 🌉 Especificación de Interfaz Neuronal (Toolkit ↔ Sognatore)

## 1. El Cerebro Unificado
Para que el sistema trabaje como un solo organismo, los agentes del Toolkit y el núcleo de Sognatore comparten un mismo bus de datos y espacio de nombres.

### Canales de Comunicación
- **Llamadas de Agente**: Los agentes del Toolkit (`../../toolkit/agents/`) invocan métodos del `Sognatore Core` mediante el `Orchestrator.ts`.
- **Inyección de Memoria**: El `brain` agent (Toolkit) escribe directamente en el `MemoryHub.ts` (Sognatore) para asegurar que la "verdad" sea compartida.
- **Veto del Sentinel**: El sistema inmunológico `Sentinel-Sognatore` puede bloquear acciones de cualquier agente del Toolkit si violan las `SOGNA_CORE_RULES`.

## 2. Especialidades y Roles

| Componente | Especialidad | Interfaz Neuronal |
|---|---|---|
| **Sognatore Core** | Ejecución y Estado | `StateStore.ts` ↔ [[agent-manager]] |
| **Sentinel Engine** | Defensa e Integridad | `Guardian.ts` ↔ [[review-security]] |
| **Memory Hub** | Sabiduría y Pasado | `MemoryHub.ts` ↔ [[brain]] |
| **Integrations** | Conexión Exterior | `integrations/` ↔ [[eng-api]] |

## 3. Protocolo de Sincronización
Cada vez que un agente del Toolkit adquiere una nueva **Skill**, esta se registra automáticamente en el `SkillRegistry.ts` de Sognatore para que el sistema sepa que ha evolucionado.

## 4. Próximos Pasos de Evolución
Para maximizar las capacidades del sistema, implementaremos:
- **Semantic Sync**: Migración de `MemoryHub.ts` de búsqueda literal a búsqueda vectorial (búsqueda semántica avanzada).
- **Reactive UI**: Evolución de `TerminalSubscriber.ts` hacia un Dashboard dinámico con **Framer Motion**, permitiendo visualizaciones de grafos en tiempo real.

---
> [!NOTE]
> La comunicación es bidireccional. Sognatore no usa herramientas; Sognatore **es** sus herramientas.
