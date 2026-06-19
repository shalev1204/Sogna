# SOGNA ACTIVE CONTEXT: HOLOGRAM

> [!IMPORTANT]
> **AI ATTENTION ANCHOR**: Este archivo es el estado de conciencia actual del sistema.

## 1. Identidad e Institucion

- **Entidad**: Sogna.
- **Identidad**: Antigravity (Agente Institucional).
- **Mandato**: Proactividad total en recuperacion de contexto.
- **Tratamiento**: El usuario es el **Operador** (Trato Institucional/Usted).
- **Lexico**: Estrictamente profesional. PROHIBIDO: adjetivos innecesarios.

## 2. Misión Actual

- **Objetivo (Fase E — 2026-Q2)**: **Plataforma de desarrollo agéntica reutilizable** — Sogna como motor local (MCP + Ollama) que se acopla a cualquier producto/empresa del holding, no como monolito cerrado.
- **Estado**: **EN PIVOTE** — bootstrap operativo (`dream.sh` / `sogna:dream`) avanzado; **infraestructura core pendiente de rediseño**.
- **Meta (general)**:
  - Un **Sogna por máquina** (background: memoria, MCP, worker, gobierno).
  - Un **proyecto/producto por workspace** (código del cliente: SaaS, automatizaciones, dominio).
  - **Setup impresionante**: clonar → configurar identidad/empresa → operar con estándares Sogna.
  - **Local-first + Ollama** para cargas masivas en background (informes, protocolos, batch) sin depender de cloud por defecto.
  - **Skills y MCP por proyecto**, no catálogo fijo de ~1000 skills; infraestructura clara primero, depuración después.
- **Próximo hito obligatorio**: **Cambio de infraestructura** (sustituir Chroma y capas acopladas; rediseñar DB, backend, frontend, cloud, seguridad bajo estándares unificados configurables por tenant).
- **Hitos recientes (bootstrap)**:
  - `sogna:dream` / `dream.sh` — toolchain + pull + deps + Chroma bootstrap (Chroma es **deuda transitoria**).
  - Chroma fuera de Git; sync multi-dispositivo vía GitHub + bootstrap local.
  - MCP UMA renombrado; contrato MCP P4–P6 operativo.

## 2.1 Roadmap inmediato (orden)

1. **Infraestructura** — SSOT datos, backend API, almacenamiento vectorial (post-Chroma), auth/seguridad, contrato tenant.
2. **Onboarding tenant** — wizard/config: empresa, proyecto, skills/MCP requeridos, workspace dual (Sogna + producto).
3. **Depuración** — reducir skills/agentes al mínimo viable sobre la nueva infra.
4. **Pulido** — UX setup, observabilidad, worker queue a escala.

## 2.2 Decisiones P0 (Operador — 2026-06-18)

| Tema | Decisión |
|------|----------|
| Vector store | **Supabase Postgres + pgvector** (sustituye Chroma) |
| Workspace | **Cursor multi-root** — `Sogna/` + carpeta proyecto hermana |
| Config tenant | **SSOT en repo del proyecto**; Sogna accede vía binding de workspace (lectura directa, sin duplicar gobierno) |
| Skills | **40–60 curated** compartidas Curator ↔ Sognatore (un solo catálogo) + skills del proyecto en repo del producto |
| SSOT tenant (forma) | Carpeta **`.sogna/`** en repo producto (`tenant.yaml`, `company.yaml`, `mcp.json`) |
| Secuencia infra | **pgvector + UMA recall primero**; pivote global abarca 11 dominios (ver 2.3) |

## 2.3 Pivote de infraestructura (alcance completo)

**SSOT:** `infra/core-stack.json` + `infra/sogna_core_lean.html` (12 dominios, F0–F3, coste y triggers por herramienta).

No limitado al vector store. Dominios a rediseñar y profesionalizar:

1. **Backend** — FastAPI + LangGraph (F0); Temporal/Sentinel diferidos
2. **Bases de datos** — Supabase Free (Postgres + pgvector + Auth); Neo4j/Qdrant diferidos
3. **Cloud** — Hetzner CX21 + Cloudflare Free + Vercel Free (F0)
4. **Compliance** — diferido hasta 2º operador
5. **Dataflow** — Redis + Celery en VPS (F0)
6. **DevOps** — GitHub + Docker + Trivy
7. **Frontend** — Next.js + shadcn + R3F (sustituye panel control legacy a medio plazo)
8. **IA** — Anthropic Haiku + LiteLLM + Ollama local
9. **Monitoring** — Grafana Cloud Free + OTel
10. **Network** — Nginx en Hetzner
11. **Operations** — billing/analytics diferido F0
12. **Security** — Supabase Auth + permisos en código

Orden de ejecución: **(1) pgvector + recall UMA** → API backend → auth → frontend control.

## 2.4 Auditoría F0 (2026-06-19) — estado vs spec

| Dominio | Spec F0 | Estado repo | Gap |
|---------|---------|-------------|-----|
| BBDD | Supabase pgvector | **Operativo** — 58 docs, MCP recall OK | Chroma legacy deprecado |
| Cloud | Hetzner/CF/Vercel | Solo local Windows | Sin VPS ni deploy scripts cloud |
| Backend | FastAPI | UMA MCP FastAPI ✓ | LangGraph no cableado |
| Mensajería | Redis+Celery | Worker queue JSON local | Sin Redis/Celery en Docker |
| Auth | Supabase Auth | Permisos código parcial | Sin Supabase Auth integrado |
| Obs | Grafana+OTel | verify:p2b parcial | Sin export Grafana Cloud |
| IA | Haiku+Ollama | Ollama worker ✓ | LiteLLM routing no SSOT |
| Frontend | Next.js dashboard | `control/index.html` legacy | Migración pendiente |
| CI/CD | GitHub+Docker+Trivy | GitHub ✓ | Trivy en pipeline pendiente |
| Tenant | `.sogna/` en producto | Plantilla en `infra/templates/.sogna/` | Wizard onboard pendiente |

**Implementado hoy:** `vector_store.py`, migración SQL, `vector:index`, dream phase `vector`, `infra/core-stack.json`.

## 3. Estado del Ecosistema

- **Nexus Dashboard**: ONLINE (Holographic Shell Unified)
- **Reflection Engine**: REPAIRED (CloudEvents compliant, timeout protections)
- **Distillation Engine**: REPAIRED (CloudEvents compliant, .md + .json support)
- **Consolidation Pipeline**: OPERATIONAL (3-phase: Working->Episodic->Semantic->Graph)
- **Knowledge Graph**: 57 nodes, 85 edges, 0 orphaned, auto-validated
- **Event Bus**: CloudEvents 1.0 (27 events, 200-cap unificado, 7+ event types)
- **Hybrid Oracle**: ENHANCED (Tokenized scoring: label=3x, id=2x, desc=1x)
- **Sognatore (Telemetry)**: ONLINE (Neural Pulse Active)
- **EventBus.ts**: OPERATIONAL (TypeScript CloudEvents singleton, EventBus-integrated GlobalMemory)
- **UMA (Neural Memory)**: ONLINE (5 MCP tools: recall, graph, context, events, pipeline)
- **SSOT Updater**: REPAIRED (CloudEvents, timeout, content guard, backup archiving)
- **Prune Engine**: REPAIRED (CloudEvents, episodic pruning, bus event check)
- **UMA Doctor**: EXPANDED (7-section health check, graph + bus + pipeline audits)
- **Index UMA**: IMPROVED (batch upsert, events indexing, truncation, normalized paths)
- **Query Memory**: REPAIRED (indentation, error handling, collection guard)
- **L1 RAM**: REPAIRED (dunder bug, indentacion, ruta dinamica)
- **Registry Config**: 13 layers, consolidation_config completo (7 scripts registrados)

## 4. Tareas Prioritarias

- [x] **P0 Supabase pgvector** — esquema + migración + UMA API en Supabase.
- [ ] **P0 Infraestructura** — Hetzner bootstrap; Redis/Celery Docker
- [ ] **P0 Onboarding** — setup un comando + configuración empresa/proyecto (workspace dual).
- [ ] **P1 Depuración skills/MCP** — catálogo mínimo por estándar Sogna, extensible por proyecto.
- [ ] Refinamiento UX setup (`dream`) tras infra asentada.
- [x] Bootstrap multi-dispositivo (`dream.sh`, Chroma gitignored, `sogna:dream`).

---

**Timestamp**: 2026-06-19T14:00:00.000Z
