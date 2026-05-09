# Memory Architecture (UMA) 🧠

Welcome to the memory management center of the Sogna Ecosystem. This directory constitutes the **Unified Memory Architecture (UMA)**, a technical system designed for persistent identity state, cross-engine synchronization, and security enforcement.

## 🏗️ Architecture Layers

The memory is organized into nine specialized layers, as defined in the authoritative `registry.json`:

### 1. Identity Layer (Core)
- **Files**: `rules.md`, `sogna.md`, `strategic_intent.md`, `user_profile.md`.
- **Purpose**: Defines the system's absolute behavior, strategic vision, and operator personality.

### 2. Immunological Layer
- **Path**: `security/`
- **Purpose**: Threat detection, incident logging, and learned behavioral defenses.

### 3. Episodic Layer
- **Path**: `intelligence/episodic/`
- **Purpose**: Specific past project solutions, historical task fragments, and reflective logs.

### 4. Semantic Layer
- **Path**: `intelligence/semantic/`
- **Purpose**: Generalized facts, extracted rules, design tokens, and categorized CSV datasets.

### 5. Layer
- **Path**: `operational/agent/`
- **Purpose**: Volatile session state and active agent task context (`current_task.md`).

### 6. Navigator Layer
- **Path**: `operational/navigator/`
- **Purpose**: Project structure mapping, structural graphs, and exploration cache.

### 7. Design Layer
- **Path**: `designs/`
- **Purpose**: Master aesthetic files (master.md), UI reasoning, and design logic memory.

### 8. Logs Layer
- **Path**: `operational/logs/`
- **Purpose**: Operational audit trails, systemic event logs, and history tracking.

### 9. Synapses Layer
- **Path**: `operational/synapses/`
- **Purpose**: Cross-engine behavioral links (Animator, Predatore, Sentinel, etc.).

### 10. Documentation Layer
- **Path**: `docs/`
- **Purpose**: Technical manuals, architecture reports, and structural mapping.

---

## 📂 Directory Map (Sanitized)

```text
memory/
├── archive/             # Cold storage (Historical reports)
├── designs/             # UI/UX master files & reasoning (master.md)
├── docs/                # Architecture reports & manuals
├── identity/            # Core system behaviors (rules.md, sogna.md, reflect.py)
├── intelligence/        # Knowledge base & datasets
│   ├── episodic/        # Specific past solutions & reflections
│   └── semantic/        # Generalized facts & data (CSV)
├── operational/         # Logs, synapses, agent context, and active state
└── security/            # Immunological defenses (incident_log.md)
```

---

## 🛠️ Maintenance & Intelligence Tools

The UMA is a self-maintaining system powered by local AI:

- **[uma-doctor.py](identity/uma-doctor.py)**: Professional Auditor. Checks nomenclature, registry sync, and vector DB health.
- **[reflect.py](identity/reflect.py)**: Autonomous Reflection. Uses **Ollama** to synthesize logs into episodic memory.
- **[index_uma.py](identity/index_uma.py)**: Semantic Indexer. Syncs memory content with the ChromaDB vector store.
- **[query_memory.py](identity/query_memory.py)**: Semantic Search (RAG). Perform intelligent queries on the knowledge base.
- **[prune.py](identity/prune.py)**: Data Lifecycle. Archives old logs and optimizes the active context.

---

## 🔐 Security & Integrity Protocols

The UMA operates under the **Hardening Protocol**:
1. **Filename Normalization**: All paths and filenames MUST be lowercase.
2. **Registry Sync**: The physical filesystem must mirror the `registry.json` definition.
3. **Identity Priority**: Identity files (`rules.md`, `sogna.md`) are the primary source of truth for all agents.

---
*UMA Version: 2.0.0 | Status: Tiered (Semantic/Episodic) & Stabilized*
