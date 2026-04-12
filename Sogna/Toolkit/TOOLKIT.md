# SOGNA ANTIGRAVITY TOOLKIT

Welcome to the professional operational kit for Sogna agents. This toolkit provides the standards, personas, and workflows required to build premium software at scale.

## Structure

```text
sogna/toolkit/
├── agents/    # Specialized agent personas (Orchestrator, Planner, etc.)
├── rules/     # Technical standards (Gemini, CLI, Styling)
├── workflow/  # Operational command procedures (Plan, Diagnostic, Create)
├── skills/    # Core repositories of architectural knowledge
└── shared/    # Reusable assets and configurations
```

## How to Use

### As a Developer

- Use `node sogna.js toolkit` to explore available resources.
- Refer to the `rules/` directory when implementing new features to ensure compliance.
- Use `node sogna.js doctor` to verify your environment health.

### For AI Agents

- The root `.sognarules` automatically configures agents to follow this toolkit.
- Agents follow the **Orchestrator Pattern**:
  1. **Socratic Gate**: Asking for clarification.
  2. **Planning**: Creating a structured execution path.
  3. **Execution**: Atomic building with specialized personas.

## Integration Protocols

- **Specialists**: Agents should assume roles defined in `agents/specialists.md` for technical tasks.
- **Workflows**: Common tasks like `/plan` and `/create` are documented in `workflow/` for consistent execution.

---

Powered by Sogna & Antigravity Kit
