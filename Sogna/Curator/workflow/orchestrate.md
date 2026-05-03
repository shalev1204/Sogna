---
id: workflow-orchestrate
owner: [[orchestrator]]
---

---
description: Coordinate 3+ agents for complex multi-domain tasks.
---

# Multi-Agent Orchestration Protocol ➰

## 1. Critical Rules
- **Min 3 Agents**: Mandatory. Using <3 agents = delegation, NOT orchestration.
- **2-Phase Execution**:
  - **Phase 1 (Planning)**: Sequential. `project-planner` + `explorer-agent`. Create `docs/PLAN.md`.
  - **Checkpoint**: User approval REQUIRED before Phase 2.
  - **Phase 2 (Implementation)**: Parallel agents (Foundation, Core, Polish).
- **Context Passing**: Subagents MUST receive: Request, Decisions, Previous Work, and Plan State.

## 2. Execution steps
1. **Analyze Domains**: Identify touchpoints (Security, Backend, Frontend, DB, Test, DevOps).
2. **Phase Detection**: If `PLAN.md` exists + approved → Phase 2. Otherwise → Phase 1.
3. **Invoke Specialists**: Parallel invocation after approval.
   - *Foundation*: DB Architect, Security Auditor.
   - *Core*: Backend Specialist, Frontend Specialist.
   - *Polish*: Test Engineer, DevOps Engineer.
4. **Verification**: Execute `security_scan.py` and `lint_runner.py`.

## 3. Output Format (Synthesis)
Unified report:
- Task Summary & Agents Invoked (Min 3).
- Verification Script Results.
- Key Findings per Agent.
- Deliverables & Final Summary.

> 🛑 **EXIT GATE**: Verify agent count >= 3, security scripts ran, and unified report generated.

