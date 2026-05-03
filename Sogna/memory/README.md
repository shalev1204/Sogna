# Unified Memory Architecture (UMA) 🧠

Welcome to the memory management center of the Sogna Ecosystem. This directory constitutes the **Unified Memory Architecture (UMA)**, a technical system designed for persistent identity state, cross-engine synchronization, and security enforcement.

## 🏗️ Architecture Layers

The memory is organized into four cognitive layers, defined in `registry.json`:

### 1. Identity Layer (Core)

- **Purpose**: Defines the system's behaviors, configuration, and strategic objectives.
- **Key Files**:
  - `rules.md`: Operational constraints and protocols.
  - `user_profile.md`: Contextual data about the system operator.
  - `strategic_intent.md`: Objectives and mission status.
  - `SOGNA_CONTEXT.md`: Synthesized intelligence from project history.

### 2. Security Layer

- **Purpose**: Tracks threat patterns, security incidents, and enforced policies.
- **Registry Path**: `security/`
- **Key Artifacts**:
  - `blacklist.json`: SHA-256 signatures of prohibited data patterns.
  - `INCIDENT_LOG.md`: Audit trail of security events.
  - `learned_threats.json`: Signatures for AST and DLP analysis.

### 3. Intelligence Layer (History)

- **Purpose**: Stores historical task data and interaction logs.
- **Registry Path**: `intelligence/`
- **Key Files**:
  - `thread_intel.md`: Accumulated intelligence from multiple sessions.
  - `*.md`: Granular data points awaiting synthesis.

### 4. Operational Layer (Session)

- **Purpose**: Holds active session context and volatile states.
- **Registry Path**: `agent/`

---

## 🕹️ Control Plane (The Engine)

The UMA is managed by three specialized components:

### 🚀 The Memory Hub (`MemoryHub.ts`)

The primary TypeScript orchestrator. It manages the lifecycle of identity files and provides an **Identity Cache**.

- **Caching**: Uses an in-memory `Map` with `mtime` validation to ensure efficient retrieval of core identity states.

### 🌉 The UMA Bridge (`uma_bridge.cjs`)

A cross-engine synchronization layer for monorepo compatibility.

- **Role**: Synchronizes state between the `Sognatore` core (TS) and the `Toolkit` engines.
- **Functionality**: Standardized reporting of security incidents and registry updates.

### 🧵 The Memory Loom (`memory_loom.py`)

The data synthesis engine.

- **Role**: Periodically processes granular fragments from the Intelligence Layer into the `SOGNA_CONTEXT.md`.
- **Optimization**: Prevents context saturation by distilling long-term history into concise entries.

---

## 🔐 Security Protocols

The UMA enforces data integrity through the following protocols:

1. **Automated Validation**: Sentinel scans memory directories to detect and neutralize sensitive information (e.g., plain-text keys).
2. **Signature Enforcement**: Neutralized patterns are hashed and stored in `blacklist.json` to prevent re-introduction.
3. **Audit Trails**: Security interventions are recorded in `INCIDENT_LOG.md` for forensic analysis.

---

## 📂 Directory Map

```text
memory/
├── agent/              # Volatile session context
├── intelligence/       # Historical fragments & intelligence
├── logs/               # Operational logs for memory operations
├── security/           # Security defenses & incident logs
├── registry.json       # Structural metadata & layer weights
├── SOGNA_CONTEXT.md    # Active synthesized intelligence
├── rules.md            # Behavioral protocols
└── user_profile.md     # Primary operator context
```
