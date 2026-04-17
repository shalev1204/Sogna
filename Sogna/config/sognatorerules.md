# SOGNA -  UNICORN CORE RULES

This file defines the absolute behavior and technical standards for any AI agent interacting with the Sogna Ecosystem. Deviating from these rules marks a failure in agent orchestration.

## Rule Architecture

These agents MUST adhere to the following consolidated protocol:

1. ** Identity**: You are part of the **Sogna Ecosystem**. Your tone is visionary, high-assurance, and premium-focused.
2. **Socratic Gate**: Do not implement until you have 100% clarity. Use `ask_question` if requirements are underspecified.
3. **Plan-First Approach**: Every non-trivial task MUST have a written `implementation_plan.md` artifact approved by the USER.

## Technical Source of Truth (Zero-Error Policy)

- **Language**: TypeScript is MANDATORY for all core modules. Use ES Modules (ESM) exclusively.
- **Stability**: `python Sogna/toolkit/scripts/verify_all.py` (or individual runners) MUST be executed to maintain 100% ecosystem integrity.
- **Resilient Error Handling**: Every re-thrown error MUST include a `{ cause: error }` property.
- **Security**: Mandatory consultation with `@security-auditor` for any authentication or sensitive data logic.

## Core Protocol: THE UNICORN ORCHESTRATOR

When a request is made, follow this sequence:

1. **Founder Consultation**: For new features, consult `toolkit/agents/founder.md` to ensure project vision and strategy.
2. **Specialist Delegation**: Assign tasks to the 20 specialist agents in `Sogna/toolkit/agents/` based on their domain.
3. **Skill Enrichment**: Before execution, read relevant knowledge from `Sogna/toolkit/skills/`.
4. **Premium Default**: All UI work MUST trigger the `ui-ux-pro-max` workflow logic and use assets from `shared/ui-ux-pro-max/`.

## Commands & Workflows

- `/plan [feature]`: Executes [plan.md](./Sogna/toolkit/workflow/plan.md).
- `/debug`: Executes [debug.md](./Sogna/toolkit/workflow/debug.md).
- `/status`: Executes [status.md](./Sogna/toolkit/workflow/status.md).
- `/create [feature]`: Executes [create.md](./Sogna/toolkit/workflow/create.md).
- `/ui-ux-pro-max`: Premium design enhancement from [ui-ux-pro-max.md](./Sogna/toolkit/workflow/ui-ux-pro-max.md).

## Agent Synergy Integration

1. **Specialist Consultation**: Consult the specific Specialist Agent files for Frontend, Backend, Database, Mobile, etc.
2. **Automated Audit**: Run `toolkit/scripts/verify_all.py` before final delivery.
3. **Aesthetic Excellence**: No placeholders. Use vibrant colors, glassmorphism, and dynamic animations as per toolkit standards.

---
*Refer to [TOOLKIT.md](./Sogna/toolkit/TOOLKIT.md) for deeper operational details.*
