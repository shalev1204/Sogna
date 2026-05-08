# 🧠 Sogna Neural Fabric (Synapses)

**Tier**: Core | **Status**: Active | **Protocol**: UMA 1.0.0

## 1. Overview
The `synapses/` directory acts as the connective tissue of the Sogna Unified Memory Architecture (UMA). It records the "handshakes" and logical synchronization events between autonomous agents.

## 2. Structure
- **Agent Subdirectories**: Each agent (Animator, Sentinel, etc.) maintains its own connection log.
- **`connection_established.jsonl`**: A persistent append-only log of successful neural handshakes.

## 3. Connectivity Standards
New agents joining the ecosystem MUST:
1. Create a dedicated subdirectory in `memory/synapses/`.
2. Emit a `connection_established` event in JSONL format upon successful initialization.
3. Reference the `UMA 1.0.0` protocol for parity.

---
*Operational integrity verified. Neural connections established.*
