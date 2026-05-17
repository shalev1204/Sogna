# Plan de Implementación: Consolidación de Memoria Híbrida

## Diagnóstico del Estado Actual

### Hallazgos Críticos

| Componente | Estado | Problema |
| :--- | :--- | :--- |
| `graph.json` (2.3MB) | ❌ PLACEHOLDER | 108K líneas de nodos ficticios ("Memoria Latente #3298"). Sin campo `path`. El traversal de Phase 2 en `query_uma.py` **nunca encuentra resultados**. |
| `reflect.py` | ⚠️ DEGRADADO | Errores de indentación en líneas 63, 98, 104, 106. Funcional pero frágil. |
| `distill.py` | ❌ ROTO | `_file_` en lugar de `__file__`, `_name_` en lugar de `__name__`. No ejecuta. |
| `bus.json` | ⚠️ MÍNIMO | Solo 2 eventos. Sin esquema estándar, sin TTL, sin prioridades. |
| `GlobalMemory.ts` | ⚠️ BÁSICO | Solo JSON plano con filtro por `department/topic`. Sin semántica. |

---

## Fase D: Consolidación de Memoria Híbrida (3 Pilares)

### Pilar 1: Grafo de Conocimiento Institucional Real
- [ ] Generar un `graph.json` real con entidades del ecosistema Sogna
- [ ] Tipos de nodo: `Agent`, `Module`, `Document`, `Rule`, `Decision`, `Service`
- [ ] Tipos de relación: `depends_on`, `governs`, `monitors`, `produces`, `consumes`
- [ ] Vincular cada nodo a su archivo real en el filesystem

### Pilar 2: Pipeline de Consolidación Sináptica
- [ ] Corregir `distill.py` (bugs `__file__`, `__name__`)
- [ ] Corregir `reflect.py` (indentación rota)
- [ ] Crear `consolidate.py`: pipeline 3-fases (Working → Episodic → Semantic)

### Pilar 3: Event Bus Institucional (CloudEvents)
- [ ] Rediseñar `bus.json` con esquema CloudEvents
- [ ] Implementar `EventBus.ts` en Sognatore para emisión tipada
- [ ] Conectar el bus al TelemetryServer existente
