# SOGNA BLUEPRINT PROTOCOL (SBP)

## 1. Governance
The SBP is the supreme law of the Sogna Ecosystem. All engines (`Stylist`, `Navigator`, `Animator`, `Assembler`) must operate within its constraints.

## 2. Structural Requirements
Every Sogna-managed project must have the following structure:
- `/memory`: Stores the project's knowledge base and design systems.
- `/toolkit`: Contains the native engines and orchestration logic.
- `/src`: The application source code, generated and maintained by `Assembler`.

## 3. Inter-Engine Communication
Communication between engines is strictly managed by **Cerebro**.
- **Data Flow**: `Navigator` (Mapping) -> `Stylist` (Reasoning) -> `Assembler` (Synthesis) -> `Animator` (Kinetic Polish).
- **Format**: All internal data exchange must use standardized JSON formats.

## 4. The Sovereignty Mandate
- No external APIs are permitted for core logic unless explicitly authorized (e.g., Brave Search for data enrichment).
- All dependencies must be localized or explicitly mirrored within the ecosystem.
- Naming conventions must remain strictly native: No mentions of non-Sogna technology in the final output.

## 5. Deployment Lifecycle (`sogna dream`)
1. **Initiation**: `Cerebro` wakes up.
2. **Mapping**: `Navigator` creates the architectural graph.
3. **Reasoning**: `Stylist` generates the design system based on the graph.
4. **Synthesis**: `Assembler` builds the components.
5. **Animation**: `Animator` applies the kinetic layer.
6. **Delivery**: The project is ready for activation.

## 6. Agential Security & Permissions
The ecosystem implements a tiered permission model for all agential operations:
- **Level 0 (Observer)**: `Navigator` - Mapping only. No file mutation.
- **Level 1 (Creative)**: `Stylist` / `Animator` - Mutation restricted to `/memory/designs/` and CSS assets.
- **Level 2 (Architect)**: `Assembler` - Mutation restricted to `/src/` and component registries.
- **Level 3 (Sovereign)**: `Cerebro` - Full filesystem and orchestration authority.
- **Level X (External)**: Any non-Sogna tool. Restricted to `READ_ONLY` on public assets.

---
*Status: INSTITUTIONAL | Version: 1.1.0*
