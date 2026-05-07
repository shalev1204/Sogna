# SOGNA BLUEPRINT PROTOCOL (SBP)

## 1. Governance

The SBP defines the operational standards of the Sogna Ecosystem. All engines (`Stylist`, `Navigator`, `Animator`, `Assembler`) must operate within its constraints.

## 2. Structural Requirements

Every Sogna-managed project must have the following structure:

- `/memory`: Stores the project's knowledge base and design systems.
- `/toolkit`: Contains the native engines and orchestration logic.
- `/src`: The application source code, generated and maintained by `Assembler`.

## 3. Inter-Engine Communication

Communication between engines is managed by **Cerebro**.

- **Data Flow**: `Navigator` (Mapping) -> `Stylist` (Reasoning) -> `Assembler` (Synthesis) -> `Animator` (Kinetic Polish).
- **Format**: All internal data exchange must use standardized JSON formats.

## 4. Operational Autonomy

- External APIs are restricted to authorized services (e.g., Brave Search for data enrichment).
- Dependencies must be managed locally or explicitly documented within the ecosystem.
- Naming conventions must remain technical and consistent with the Sogna Ecosystem.

## 5. Deployment Lifecycle (`sogna dream`)

1. **Initiation**: `Cerebro` initialization.
2. **Mapping**: `Navigator` creates the architectural graph.
3. **Reasoning**: `Stylist` generates the design system based on the graph.
4. **Synthesis**: `Assembler` builds the components.
5. **Animation**: `Animator` applies the kinetic layer.
6. **Delivery**: Project delivery.

## 6. Agential Security & Permissions

The ecosystem implements a tiered permission model for all agential operations:

- **Level 0 (Observer)**: `Navigator` - Mapping only. No file mutation.
- **Level 1 (Creative)**: `Stylist` / `Animator` - Mutation restricted to `/memory/designs/` and CSS assets.
- **Level 2 (Architect)**: `Assembler` - Mutation restricted to `/src/` and component registries.
- **Level 3 (Orchestrator)**: `Cerebro` - System-wide orchestration and configuration authority.
- **Level X (External)**: Non-Sogna tools. Restricted to `READ_ONLY` on public assets.

---
*Status: INSTITUTIONAL | Version: 1.1.0*
