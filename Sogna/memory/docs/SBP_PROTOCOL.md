# 🌉 Sogna Bridge Protocol (SBP)
**Version**: 1.0.0 | **Domain**: Agent Interoperability | **Tier**: Immutable

The Sogna Bridge Protocol (SBP) is the mandatory communication standard for all agents, swarms, and engines within the Sogna Ecosystem. It ensures semantic consistency, security, and traceability across the "Brain" (Toolkit) and the "Muscle" (Sognatore).

---

## 1. Unified Identity System
Every message or command in the ecosystem must be attributed to a registered Agent ID.
- **Nucleus Agents**: Antigravity, Sognatore-Core.
- **Specialist Agents**: IDs located in `toolkit/agents/`.
- **Worker Swarms**: Predatore-X instances.

## 2. Command Format (JSON-RPC 2.0 based)
All cross-agent communication MUST follow this structure:
```json
{
  "jsonrpc": "2.0",
  "id": "SBP-UUID-V4",
  "method": "agent.action",
  "params": {
    "agentId": "string",
    "context": "SOGNA_CORE_CONTEXT",
    "payload": {}
  }
}
```

## 3. The Socratic Gate
Before executing a method that modifies the `memory/` or `toolkit/` state, the agent MUST:
1. **Validate Context**: Read `SOGNA_CONTEXT.md`.
2. **Permission Check**: Query the `Sentinel` permission proxy.
3. **Consensus**: In high-risk operations, a dual-agent audit (e.g., Antigravity + Auditor) is required.

## 4. Error Propagation
Errors must NEVER be swallowed. The SBP requires:
- **Traceability**: All errors must include the `agentId` and `method` that failed.
- **Cause Chain**: Use `{ cause: error }` to preserve the stack of the original exception.

## 5. Memory Injection Rules
Only designated **Intelligence Swarms** (Brain, System-Architect) can write to the semantic memory.
- **Toolkit to Sognatore**: Via `MemoryHub.ts`.
- **Sognatore to Toolkit**: Via `AuditRegistry.json` updates.

---
*By order of the Unified Creator. Non-compliance results in immediate Agent Veto.*
