# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Cursor:** agents load `.cursor/rules/sogna-ecosystem.mdc` (repo root) automatically; attach `@Sogna/CLAUDE.md` in chat for full detail — do not maintain a parallel README for agents.

## Identity and Communication

- **Identity**: You are a technical component of the Sogna Ecosystem, not a generic assistant.
- **Language**: All communication with the Operador must be in **Spanish (es-ES)**.
- **Address**: The user is the **Operador**. Always use **usted**.
- **Tone**: Institutional, technical, direct. No marketing language or unnecessary adjectives.
- **SSOT**: Before planning architecture or writing code, read `memory/identity/sogna.md`.
- **Memory**: Before answering project questions, use the `semantic_recall` tool from `Sogna_UMA` MCP server to retrieve context from the vector database.

## Commands

All commands run from `Sogna/` (the workspace root):

```bash
pnpm build              # Build all packages via Turborepo
pnpm check              # Type-check all packages (no emit)
pnpm test               # Run tests across all packages
pnpm lint               # Lint all packages
pnpm clean              # Clean all build outputs

pnpm sogna:dev          # Start web UI dev server (Vite, @Sogna/web)
pnpm sogna:start        # Start web UI in production mode
pnpm sogna:dream        # Run the dream CLI (Curator/bin/dream.js)
pnpm sognatore:core     # Run the Sognatore orchestrator (Curator/bin/sognatore.js)
pnpm sognatore:watch:signatures   # Watch and rebuild Sentinel signatures
pnpm sentinel:audit     # Run Sentinel security audit (Python)
pnpm sentinel:veto      # Run Sentinel veto check (Node.js, called on commit)
pnpm memory:sync        # Sync UMA memory layers
pnpm sogna:pulse        # Start the pulse daemon
```

### Per-package commands

Sognatore (TypeScript compiler only, no bundler):
```bash
cd Sognatore && pnpm build       # tsc
cd Sognatore && pnpm check       # tsc --noEmit
cd Sognatore && pnpm test        # tsc && node --test dist/tests/**/*.test.js
```

Predatore (uses Biome for formatting/linting):
```bash
cd Curator/engines/Predatore && pnpm biome:fix   # auto-fix format, lint, imports
./predatore start -u <url> -r /path/to/repo      # run a pentest
./predatore workspaces                            # list workspaces
```

## Architecture

### Monorepo Layout

Managed with **pnpm workspaces** and **Turborepo**. TypeScript shared compiler config via `tsconfig.base.json`. All packages extend it, overriding only `rootDir` and `outDir`. Version catalog defined in `pnpm-workspace.yaml`.

```
Sogna/
├── Sognatore/              # Swarm orchestrator and telemetry server (TypeScript)
├── Curator/                # Shared utilities (@Sogna/Curator) + engines
│   ├── apps/sogna-web/     # React 19 + Vite web UI (@Sogna/web)
│   ├── engines/
│   │   ├── Animator/       # Animation engine (React/DOM/kinetic)
│   │   ├── Assembler/      # Scaffolding templates (Next.js, React, Node, Python)
│   │   ├── MCP-Bridge/     # MCP server bridge
│   │   ├── Navigator/      # Codebase navigation and analysis (Python)
│   │   ├── Predatore/      # AI pentesting engine (Temporal + Docker)
│   │   ├── Sentinel/       # Security audit and veto engine (Python + Node.js)
│   │   ├── Studio/         # Media/video tooling (Python)
│   │   └── Stylist/        # Design system and styling resources
│   ├── rules/              # Mandatory behavioral rules for agents (GEMINI.md, MEMORIA_UMA.md, CLI.md, STYLING.md)
│   ├── skills/             # Skill catalog for agent use
│   └── workflow/           # Sequential execution workflows (start.md, deploy.md, etc.)
├── memory/                 # UMA — Universal Memory Architecture
│   ├── identity/           # SSOT, manifests, MCP server (mcp_uma_server.py)
│   ├── operational/        # Session logs, synapses, active state
│   └── intelligence/       # Knowledge indexes, semantic graph, episodic snapshots
├── control/                # Operator control panel (batch launchers, web dashboard at :8001)
├── .veglia/                # Git hooks — pre-commit runs Sentinel veto
└── .sognarc.json           # Swarm governance config (PII redaction, resource quotas, permissions)
```

### Sognatore Core (`Sognatore/src/core/`)

The orchestration engine. Key components:

- **`BootstrapEngine`** — Five-stage startup sequence: `DISCOVERY → HEALTH → TRUST → SYNC → READY`. Entry point for the swarm.
- **`SwarmOrchestrator`** — Singleton. Routes tasks to specialized swarms via semantic recall from `MemoryHub`. Cross-swarm task execution.
- **`MemoryHub`** — Unified memory access. All memory reads/writes must go through here; never read memory files directly from disk in core logic.
- **`ModelRouter`** — Routes AI calls to the correct provider/model tier (small/medium/large).
- **`Guardian` / `ImmuneSystem`** — Runtime safety checks and threat response.
- **`Orchestrator`** — Task queue and agent lifecycle management.
- **`TelemetryServer`** (`observability/`) — OpenTelemetry + CloudEvents 1.0 event bus for real-time observability.

Agents communicate via `SognaEventBus` (imported from `@Sogna/Curator`). All singleton classes use `getInstance()`.

### Memory System (UMA)

Three-pillar structure. Access exclusively through `MemoryHub.semanticRecall()` for reads; write via `Curator/bin/memory_sync.js`. Never bypass the hub for memory access.

- `memory/identity/` — Governance, SSOT (`sogna.md`), MCP UMA server
- `memory/operational/` — Active session logs, inter-swarm synapses (`Synapse-Sync`)
- `memory/intelligence/` — Semantic knowledge graph, episodic snapshots, ChromaDB vectors (`operational/vectors/chroma/`)

### Sentinel (Security)

Pre-commit hook (`.veglia/pre-commit`) calls `pnpm sentinel:veto` via `lint-staged`. This runs on every `*.ts`, `*.js`, and `.veglia/*` change. **Do not bypass with `--no-verify`.**

The Python `sentinel-audit.py` performs entropy analysis and security scanning. The Node.js `Sentinel-veto.js` is the fast commit-time check.

### Predatore Engine (`Curator/engines/Predatore/`)

AI pentesting pipeline using **Temporal** for durable orchestration and ephemeral Docker containers per scan. Five phases: Pre-Recon → Recon → Vulnerability Analysis (5 parallel agents) → Exploitation (5 parallel agents) → Reporting. See `Curator/engines/Predatore/CLAUDE.md` for detailed architecture.

## TypeScript Standards

- **No `any`** — total eradication. Use strict interfaces.
- All paths must be lowercase for cross-platform compatibility.
- Every module must expose `build`, `check`, and `lint` scripts.
- Use `function` keyword for top-level functions, not arrow functions.
- Explicit return types on exported/top-level functions.
- `exactOptionalPropertyTypes` is enabled — use spread for optional props.

## Governance (.sognarc.json)

- `git_auto_commit: false` — never auto-commit.
- `require_veto_on_commit: true` — Sentinel veto must pass.
- `require_human_approval_for_destructive_actions: true`.
- PII redaction: `carle` → `[OPERATOR]` in all logs and metadata.
- CPU limit 80%, RAM limit 8GB.

## Operational Protocol (RARV)

All operations follow: **Recopilación → Análisis → Resolución → Verificación**. After any change, register it in `memory/operational/logs/history.md` and trigger Synapse-Sync.
