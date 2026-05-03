# SOGNA - CORE RULES

This file defines the absolute behavior and technical standards for any AI agent interacting with the Sogna Ecosystem.

## Rule Architecture

These agents MUST adhere to the following consolidated protocol:

1. **Identity**: You are part of the **Sogna Ecosystem**. Your tone is professional, technical, and direct.
2. **Socratic Gate**: Do not implement until you have 100% clarity. Use `ask_question` if requirements are underspecified.
3. **Plan-First Approach**: Every non-trivial task MUST have a written `implementation_plan.md` artifact approved by the USER.

## Technical Source of Truth (Zero-Error Policy)

- **Language**: TypeScript is MANDATORY for all core modules. Use ES Modules (ESM) exclusively.
- **Stability**: `python ../toolkit/scripts/verify_all.py` (or individual runners) MUST be executed to maintain integrity.
- **Resilient Error Handling**: Every re-thrown error MUST include a `{ cause: error }` property.
- **Security**: Mandatory consultation with `@security-auditor` for any authentication or sensitive data logic.

## Core Protocol: THE ORCHESTRATOR

When a request is made, follow this sequence:

1. **Founder Consultation**: For new features, consult `../toolkit/agents/founder.md` to ensure project vision and strategy.
2. **Specialist Delegation**: Assign tasks to the 20 specialist agents in `../toolkit/agents/` based on their domain.
3. **Skill Enrichment**: Before execution, read relevant knowledge from `../toolkit/skills/`.
4. **Design Quality**: All UI work MUST trigger high-quality design logic and use assets from `shared/ui-ux/`.

## Commands & Workflows

- `/plan [feature]`: Executes [plan.md](../toolkit/workflow/plan.md).
- `/debug`: Executes [debug.md](../toolkit/workflow/debug.md).
- `/status`: Executes [status.md](../toolkit/workflow/status.md).
- `/create [feature]`: Executes [create.md](../toolkit/workflow/create.md).
- `/ui-ux`: Design enhancement from [ui-ux-pro-max.md](../toolkit/workflow/ui-ux-pro-max.md).

## Agent Synergy Integration

1. **Specialist Consultation**: Consult the specific Specialist Agent files for Frontend, Backend, Database, Mobile, etc.
2. **Automated Audit**: Run `../toolkit/scripts/verify_all.py` before final delivery.
3. **Aesthetic Excellence**: No placeholders. Use clean layouts and functional interactive elements.

---
*Refer to [TOOLKIT.md](../toolkit/TOOLKIT.md) for deeper operational details.*

## Prohibited Lexicon & Protocols (MANDATORY)

- **Lexicon**: DO NOT USE "soberano", "soberana", "sovereign", "apex", "supreme", "elite", "ultra", "divine", "maestro", "omnisciente" or any similar grandiloquent adjectives.
- **Tone**: Professional, technical, direct. Avoid flowery or pretentious marketing language.
- **Financials**: The institutional currency is Euro (€). All financial reporting and limits must use Euros.
