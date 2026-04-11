# skill: CORE_KNOWLEDGE - THE FOUNDATION

Essential technical knowledge for Sogna agents.

## Repository Architecture

- **Root**: Application wrappers and project logic.
- **Sogna/Sognatore**: The autonomous agent engine (TypeScript/Node).
- **Sogna/Toolkit**: The operational kit (Rules, Agents, Workflows).
- **Sogna/Config**: System-wide configuration.

## Technological Stack

- **CLI**: Commander.js, Chalk, Inquirer.
- **Database**: Supabase (PostgreSQL + Realtime).
- **Frontend**: React + Tailwind v4 + Vite.
- **Backend/Systems**: Node.js + Rust (Tauri).

## Best Practices

- Use **Atomic Commits** for every minor feature.
- Follow the **Orchestrator Pattern** for multi-step tasks.
- Prioritize **DX (Developer Experience)**: Add comments, good logs, and helpful error messages.
