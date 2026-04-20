# Sovereign Unified Memory Architecture (UMA) 🧠

Welcome to the heart of the Sogna Ecosystem. This directory constitutes the **Unified Memory Architecture (UMA)**, an institutional-grade intelligence synthesis system designed for persistent identity state, cross-engine synchronization, and radical security enforcement.

## 🏗️ Architecture Layers

The memory is organized into four distinct cognitive layers, defined in `registry.json`:

### 1. Identity Layer (Core)

- **Purpose**: Defines the system's fundamental behaviors, personality, and strategic intent.
- **Key Files**:
  - `rules.md`: Operational constraints and protocols.
  - `user_profile.md`: Contextual data about the system operator.
  - `strategic_intent.md`: High-level objectives and mission.
  - `SOGNA_CONTEXT.md`: The "active consciousness" synthesized from recent experiences.

### 2. Immunological Layer (The Shield)

- **Purpose**: Tracks threat patterns, history of compromises, and enforced security policies.
- **Registry Path**: `security/`
- **Key Artifacts**:
  - `blacklist.json`: SHA-256 signatures of neutralized secrets.
  - `INCIDENT_LOG.md`: Permanent audit trail of security violations.
  - `learned_threats.json`: Signatures for AST and DLP analysis.

### 3. Episodic Layer (History)

- **Purpose**: Stores historical task fragments and raw interaction data.
- **Registry Path**: `intelligence/`
- **Key Files**:
  - `thread_intel.md`: Accumulated intelligence from multiple sessions.
  - `fragments/*.md`: Granular data points waiting for synthesis.

### 4. Operational Layer (Session)

- **Purpose**: Holds active session context and volatile identity states.
- **Registry Path**: `agent/`

---

## 🕹️ Control Plane (The Engine)

The UMA is orchestrated by three specialized components working in synergy:

### 🚀 The Memory Hub (`MemoryHub.ts`)

The primary TypeScript orchestrator. It manages the lifecycle of identity files and provides a high-performance **Identity Cache**.

- **Caching**: Uses an in-memory `Map` with `mtime` validation to ensure sub-millisecond retrieval of core identity states without redundant I/O.

### 🌉 The UMA Bridge (`uma_bridge.cjs`)

A cross-engine synchronization layer written in CommonJS for maximum monorepo compatibility.

- **Role**: Synchronizes state between the `Sognatore` core (TS) and the `Toolkit` engines (Sentinel, Predatore, Loom).
- **Functionality**: Standardized reporting of security incidents and registry updates.

### 🧵 The Memory Loom (`memory_loom.py`)

The intelligence synthesis engine.

- **Role**: Periodically "weaves" granular fragments from the Episodic Layer into the `SOGNA_CONTEXT.md` in the Identity Layer.
- **Optimization**: Prevents context window saturation by distilling long-term history into concise, actionable insights.

---

## 🔐 Security Protocols

The UMA enforces a **Zero-Persistence Policy** for sensitive information:

1. **Radical Purge**: Sentinel autonomously scans all memory directories. Upon detecting a secret (id_rsa, .env, keys), it triggers an immediate `fs.unlinkSync()` to prevent data exfiltration.
2. **Hash-Based Enforcement**: Neutralized secrets are hashed and stored in `blacklist.json`. Any future re-introduction of the same signature triggers an immediate VETO.
3. **Institutional Auditing**: Every security intervention is recorded in `INCIDENT_LOG.md` with timestamp, type, and source, ensuring a complete forensic trail.

---

## 📂 Directory Map

```text
memory/
├── agent/              # Volatile session context
├── intelligence/       # Historical fragments & thread intelligence
├── logs/               # Operational logs for memory operations
├── security/           # Immunological defenses & incident logs
├── registry.json       # Structural metadata & layer weights
├── SOGNA_CONTEXT.md    # Active synthesized intelligence
├── rules.md            # Behavioral protocols
└── user_profile.md     # Primary operator context
```

---

*This architecture is self-healing and self-organizing. It is designed to ensure that Sognatore remains both highly intelligent and radically secure.*
