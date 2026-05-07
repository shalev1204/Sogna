# ⚙️ PROTOCOLO CEREBRO: Sincronización de Contexto Sogna

Este documento establece el protocolo de sincronización para los agentes que interactúan con el ecosistema Sogna.

## 🏛️ El Cerebro (Capa de Contexto)

El Cerebro es la capa de gestión de contexto persistente del ecosistema.

- **Nodos:** 2,692 conceptos activos (Skills, Agentes, Core, Proyectos).
- **Conexiones:** 14,668 mapeos bidireccionales.
- **Estado Actual:** 🟢 SECURE (Integridad Verificada).

## 🛠️ Procedimiento de Sincronización

Al iniciar la interacción, se deben seguir estos pasos:

1. **Diagnóstico de Integridad:**

   ```powershell
   node toolkit/bin/sogna.js doctor
   ```

2. **Adquisición de Conocimiento:**

   Instancia el `MemoryHub` y realiza una búsqueda técnica de los componentes centrales: `Sogna`, `orchestrator`, `Sentinel`.

3. **Aplicación de Contexto:**

   Utiliza el contexto indexado para informar todas las propuestas y acciones.

## 🛑 Reglas Operativas

- **Preservación del Índice:** No eliminar el índice (`memory/intelligence/index.json`) sin una validación de reindexación completa.
- **Bidireccionalidad:** Mantener la integridad de los mapeos bidireccionales en `MemoryHub.ts`.
- **Autoridad Técnica:** El Cerebro es la fuente de referencia técnica principal para el ecosistema.

> [!IMPORTANT]
> La omisión de este protocolo resultará en la pérdida de coherencia técnica y degradación de la precisión operativa.
