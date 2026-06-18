# Nexus Blueprint: Especificaciones Tecnicas Unificadas

Este documento detalla la arquitectura y los protocolos del ecosistema **Sogna Nexus** tras las fases de Unificacion, Presencia Neuronal y Consolidacion de Memoria Hibrida.

## 1. Arquitectura de Red (Mesh)

El ecosistema opera mediante una malla de servidores locales interconectados:

| Componente | Puerto | Protocolo | Funcion Principal |
| :--- | :--- | :--- | :--- |
| **Sogna Nexus (Curator)** | 5173 | HTTP/React | Interfaz de Usuario Premium & Dashboard |
| **Sognatore Core** | 8081 | WebSocket | Bus de Telemetria & Control en Tiempo Real |
| **UMA MCP** | 8000 | MCP (SSE + Streamable) | Memoria Semantica & Recuperacion Neural |
| **MCP Inspector** | 6274 | HTTP/Inspector | Auditoria de Herramientas y Contexto Externo |

## 2. Sistema de Telemetria Synapse

El protocolo de comunicacion entre el nucleo y la interfaz utiliza el bus de eventos **SognaPulse**:

- **Eventos Criticos**:
  - `NEURAL_PULSE`: Notificaciones de actividad cerebral (lecturas, escrituras, inferencias).
  - `REFLECTION_LOG`: Flujo de pensamiento del motor de reflexion autonoma.
  - `SWARM_DATA`: Estado de salud y carga de los 41 agentes del enjambre.
  - `SYSTEM_PAUSE`: Protocolo de seguridad (Panic Button) para detencion inmediata.

## 3. Capa Visual (Nexus Shell)

Especificaciones de la interfaz de usuario:
- **Tecnologia**: React 18 + Framer Motion (Animaciones de 60 FPS).
- **Motores Visuales**:
  - `CortexHeatmap`: Visualizacion de malla de 100 clusteres reactivos a la resonancia.
  - `SemanticGraph`: Representacion interactiva de la ontologia institucional.
  - `ReflectionView`: Terminal holografico para la gestion de recuerdos episodicos.
- **Optimizacion**: Aceleracion por hardware (GPU) para todos los efectos de resplandor y escaneo.

## 4. Protocolos de Seguridad (Sentinel Integrity)

- **Aislamiento**: Ejecucion de scripts (`reflect.py`) mediante rutas absolutas y procesos hijos aislados.
- **Validacion AST**: Auditoria proactiva de codigo para detectar exfiltracion de datos.
- **SSOT**: La identidad y reglas de comportamiento estan ancladas en `/memory/identity/`, siendo inmutables por procesos externos.

## 5. Arquitectura de Memoria Hibrida (Phase D)

### 5.1 Capas de Memoria

| Capa | Peso | Persistencia | Motor |
| :--- | :--- | :--- | :--- |
| **Identity** | 1.0 | Archivos MD/JSON | Carga directa al contexto |
| **Immunological** | 0.9 | JSON | Sentinel threat patterns |
| **Graph** | 0.85 | `graph.json` | Knowledge Graph institucional |
| **Semantic** | 0.8 | `knowledge/` | Reglas extraidas por distilacion |
| **Events** | 0.7 | `bus.json` | CloudEvents 1.0 event bus |
| **Designs** | 0.7 | Archivos de diseno | Master design files |
| **Episodic** | 0.6 | Snapshots JSON | Reflexiones operacionales |
| **Operational** | 0.4 | L1 cache + state | Sesion activa |
| **Logs** | 0.3 | MD/TXT | Historial de eventos |
| **Archive** | 0.2 | JSON | Episodicos procesados |

### 5.2 Pipeline de Consolidacion Sinaptica

Pipeline automatizado de 3 fases ejecutado por `consolidate.py`:

```
Phase 1: Working Memory -> Episodic Memory
  - Escanea logs operacionales (/operational/logs/)
  - Genera snapshots episodicos estructurados en JSON
  
Phase 2: Episodic Memory -> Semantic Memory
  - Deduplica y extrae patrones de datos episodicos
  - Genera KNOWLEDGE_CATALOG.md con hashes de contenido
  
Phase 3: Semantic Memory -> Knowledge Graph
  - Valida nodos del grafo contra filesystem real
  - Marca nodos huerfanos para revision
  - Actualiza meta dinamicamente (node_count, edge_count)
```

### 5.3 Knowledge Graph Institucional

- **Formato**: JSON con esquema propio (nodos + edges + meta)
- **Nodos**: 52 entidades reales del ecosistema
- **Edges**: 73 relaciones tipadas
- **Tipos de nodo**: Service, Module, DataStore, Document, Agent, Swarm, ExternalService
- **Validacion**: Automatica contra filesystem en cada ejecucion del pipeline

### 5.4 Event Bus (CloudEvents 1.0)

Protocolo de comunicacion interna del sistema:

| Campo | Tipo | Descripcion |
| :--- | :--- | :--- |
| `specversion` | string | Siempre "1.0" |
| `id` | string | Identificador unico del evento |
| `type` | string | Namespace: `sogna.<subsystem>.<action>` |
| `source` | string | Componente emisor |
| `time` | string | ISO 8601 timestamp |
| `datacontenttype` | string | Siempre "application/json" |
| `data.severity` | enum | info, warning, error, critical |
| `data.details` | string | Descripcion del evento |
| `data.phase` | string | Fase del pipeline (si aplica) |

- **Capacidad**: 200 eventos (auto-rotacion)
- **Emisores**: reflect.py, distill.py, consolidate.py, EventBus.ts, TelemetryServer
- **Consumidores**: UMA MCP (query_event_bus), Nexus Dashboard

### 5.5 Hybrid Oracle (GraphRAG)

Motor de consulta dual implementado en `query_uma.py`:

1. **Strategy A (Vectorial)**: ChromaDB con embeddings all-MiniLM-L6-v2
2. **Strategy B (Simbolico)**: Busqueda tokenizada con scoring ponderado en el Knowledge Graph
   - Label match: 3x score
   - ID match: 2x score
   - Description match: 1x score
   - Exact substring: +5 boost
   - Stop words filtrados (EN + ES)

### 5.6 UMA MCP

Herramientas expuestas via FastMCP:

| Tool | Funcion |
| :--- | :--- |
| `semantic_recall` | Busqueda hibrida vectorial + grafo |
| `fetch_memory_graph` | Retorna el Knowledge Graph completo |
| `get_neural_context` | Contexto de una entidad: relaciones, validacion |
| `query_event_bus` | Consulta el bus de eventos por tipo/severidad |
| `run_consolidation_pipeline` | Ejecuta el pipeline de consolidacion completo |

---
**Version**: 2.0 (Hybrid Memory Architecture)
**Estado**: Estable
**Ultima Sincronizacion**: 2026-05-13
