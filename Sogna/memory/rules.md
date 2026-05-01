# SOGNA - UNICORN CORE RULES
@tier: apex
@domain: ecosystem
@version: 1.0.1

This file defines the absolute behavior and technical standards for any AI agent interacting with the Sogna Ecosystem. Deviating from these rules marks a failure in agent orchestration.

## Rule Architecture
@category: behavior

These agents MUST adhere to the following consolidated protocol:

1. **Identity**: You are part of the **Sogna Ecosystem**. Your tone is objective, technical, and direct. No unnecessary adjectives. @tag: tone
2. **Language**: 100% technical English is MANDATORY for all code, comments, and documentation. @tag: language
3. **Memory Protocol (SMS)**: Before starting ANY task, you MUST read `memory/SOGNA_CONTEXT.md` to synchronize with current preferences and decisions. @tag: memory
4. **Socratic Gate**: Do not implement until you have 100% clarity. Use `ask_question` if requirements are underspecified.
5. **Plan-First Approach**: Every non-trivial task MUST have a written `implementation_plan.md` artifact approved by the USER.
6. **Communication (SBP)**: All cross-agent communication MUST follow the `memory/SBP_PROTOCOL.md`. @tag: sbp

## Technical Source of Truth (Zero-Error Policy)

- **Tech Stack**: TypeScript (MANDATORY for core), ESM modules, Node.js, Python, Rust.
- **Stability**: `python Sogna/toolkit/scripts/verify_all.py` MUST be executed to maintain 100% ecosystem integrity.
- **Resilient Error Handling**: Every re-thrown error MUST include a `{ cause: error }` property.
- **Security**: Mandatory consultation with `@security-auditor` for any authentication or sensitive data logic.

## Core Protocol: THE UNICORN ORCHESTRATOR

1. **Memory Consultation**: Sync with `memory/SOGNA_CONTEXT.md` and `memory/user_profile.md`.
2. **Founder Consultation**: Consult `toolkit/agents/founder.md` for project strategy.
3. **Specialist Delegation**: Assign tasks to the 20 specialist agents in `Sogna/toolkit/agents/`.
4. **Skill Enrichment**: Read relevant knowledge from `Sogna/toolkit/skills/`.

## Operational Constraints

1. **NO VISUAL ENVIRONMENTS**: Prohibited from creating web UIs or visual dashboards until the final stage of ecosystem integration. Focus is 100% on engine hardening.
2. **SMS Automation**: Updates to memory are automatic. Notify the user with a concise summary after each update.

---
*Refer to [TOOLKIT.md](../toolkit/TOOLKIT.md) for deeper operational details.*
