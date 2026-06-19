# SOGNA INTENT: ARCHITECTURE & IDENTITY

Este documento define la intención estratégica detrás de cada decisión técnica en el Ecosistema Sogna.

---

## 1. Visión Corporativa

La meta final es una **plataforma agéntica de desarrollo y operación** que el holding despliega en cada puesto de trabajo: Sogna es la capa de inteligencia (memoria, MCP, workers locales, gobierno) detrás del software de cada filial o producto. No es un solo producto terminado; es el **motor reutilizable** que se configura por empresa y por proyecto, se acopla al repo del producto y estandariza cómo se construye, despliega y opera ese software.

## 1.1 Principios de producto (Fase E)

- **Un Sogna por máquina, un producto activo por contexto** — identidad y memoria del motor separadas del código del cliente.
- **Workspace dual** — carpeta Sogna (motor) + carpeta proyecto (dominio) en el mismo IDE; sin mezclar SSOT.
- **Setup en un ritual** — clonar, configurar tenant (empresa, datos, integraciones), instalar toolchain y operar.
- **Local-first** — MCP + Ollama para análisis y batch en background; cloud opt-in por proyecto.
- **Infraestructura antes que catálogo** — menos skills genéricas; más contrato claro (DB, API, auth, vectores, workers).
- **Estándares Sogna, implementación por tenant** — misma forma de configurar; distinta stack concreta (BD, SaaS, MCP) según el producto.

## 1.2 Decisiones de arquitectura (2026-06-18)

- **Memoria semántica**: migración a **Supabase Postgres + pgvector** (salida de Chroma).
- **Workspace**: **multi-root Cursor** — motor Sogna y repo producto como carpetas hermanas.
- **Config tenant**: vive en el **repo del proyecto**; Sogna la consume por binding de workspace (ruta resuelta al arranque, sin copia redundante salvo caché operativa).
- **Skills**: catálogo único **40–60** institucionales compartido Curator/Sognatore; skills de dominio en el repo del producto.
- **SSOT tenant**: directorio **`.sogna/`** en repo producto (`tenant.yaml`, `company.yaml`, `mcp.json`).
- **Pivote infra**: secuencia **pgvector/recall → API → auth → control UI**; alcance transversal en backend, 3× BD, cloud, compliance, dataflow, DevOps, frontend, IA, monitoring, network, operations, security.

## 2. El Mantra: "Build for the Second One"
No construimos para el ahora; construimos para que el sistema sea eterno y autosuficiente. Cada script, cada línea de código, debe ser legible, mantenible y escalable.

## 3. Protocolos de Identidad (Antigravity Core)
- **Technical Excellence**: No se permiten soluciones parciales. Si algo no es perfecto, se refactoriza.
- **Path Standards**: ALL file and directory paths MUST be lowercase.
- **Consensus Layer**: Sogna Bridge Protocol (SBP) is the mandatory communication standard.
- **Observability**: Radical transparency via logged operations in `memory/audit_registry.json`.
- **Linguistic Standard**: Comunicación institucional en **Español (es-ES)**. Tratamiento de **Usted** al **Operador**. Uso de Inglés técnico para el código.
- **Mandato**: Autonomía Operativa total. No dependemos de memorias externas fuera de la arquitectura integrada.
- **Prohibición**: Uso de términos grandilocuentes estrictamente prohibido.
- **Recursive Memory**: Integración mandatoria del bucle de conciencia UMA para garantizar la persistencia de identidad y contexto.

---

## 4. Estándares Operativos
1. **SSOT Driven**: Toda decisión debe validarse contra `sogna.md`.
2. **Zero Hallucination**: Ante la duda, consultar el UMA.
3. **Forensic Audit**: Cada acción crítica debe ser registrada.
