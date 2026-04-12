# SOGNA ANTIGRAVITY TOOLKIT

Welcome to the professional operational kit for Sogna agents. This toolkit provides 20 specialized agents, 37 domain skills, and 11 advanced workflows required to build premium software at scale.

## Structure

```text
sogna/toolkit/
├── agents/    # 20 Specialized personas (Orchestrator, Frontend, Security, etc.)
├── rules/     # Technical standards (Gemini, CLI, Styling)
├── workflow/  # 11 Operational commands (/plan, /create, /debug, etc.)
├── skills/    # 37 Repositories of architectural knowledge (folders + markdown)
├── scripts/   # Utility scripts for preview, verification, and sessions
└── shared/    # Reusable assets (UI/UX Pro Max design system)
```

## How to Use

### As a Developer

- Explore components in the subdirectories to understand the system's capabilities.
- Refer to the `rules/` directory when implementing new features to ensure compliance.
- Workflows can be triggered via slash commands in compatible AI environments.

### For AI Agents

- The root `.sognarules` automatically configures agents to follow this toolkit.
- Agents follow the **Advanced Orchestrator Pattern**:
  1. **Quick Context Check**: Quick scan of existing plan files.
  2. **Socratic Protocol**: Clarifying requirements before orchestration.
  3. **Multi-Agent Coordination**: Parallel execution across specialist domains.

## Integration Protocols

- **Specialists**: Agents MUST follow the boundaries defined in their respective persona files (e.g., `agents/frontend-specialist.md`).
- **Workflows**: Standardized commands (/plan, /create, /debug, etc.) defined in `workflow/` ensure deterministic outcomes.
- **Skills**: Automatic context enrichment based on folder-level documentation in `skills/`.

---

Powered by Sogna & Antigravity Kit
