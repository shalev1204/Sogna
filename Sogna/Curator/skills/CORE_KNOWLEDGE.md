---
type: skill
usage_count: 0
success_rate: 100%
neural_status: EVOLVING
last_sync: 2026-04-27T20:31:02.552Z
---

# skill: CORE_KNOWLEDGE - THE FOUNDATION

Essential technical knowledge for Sognatore agents.

## Repository Architecture

- **Root**: Application wrappers and project logic.
- **Sogna/Sognatore**: The autonomous agent engine (TypeScript/Node).
- **Sogna/toolkit**: The operational kit (rules, agents, workflow).
- **Sogna/config**: System-wide configuration.

## Technological Stack

- **CLI**: Commander.js, Chalk, Inquirer.
- **Database**: Supabase (PostgreSQL + Realtime).
- **Frontend**: React + Tailwind v4 + Vite.
- **Backend/Systems**: Node.js + Rust (Tauri).

## Best Practices

- Use **Atomic Commits** for every minor feature.
- Follow the **Orchestrator Pattern** for multi-step tasks.
- Prioritize **DX (Developer Experience)**: Add comments, good logs, and helpful error messages.
