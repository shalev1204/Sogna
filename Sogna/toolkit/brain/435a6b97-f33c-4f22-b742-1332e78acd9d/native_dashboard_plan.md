# Implementation Plan: Sogna Native Sovereign Dashboard

This plan outlines the steps to "absorb" the external documentation and monitoring workflows (currently in Obsidian) into the native `sogna-web` dashboard, achieving full operational sovereignty.

## Phase 1: Native Memory Infrastructure (Backend)
- [ ] **Extend `TelemetryServer`**: Add command handlers for file operations within the `memory/` directory.
    - `FETCH_MEMORY_TREE`: Recursively scan `memory/` and return a JSON tree structure.
    - `READ_MEMORY_FILE`: Read and return the raw Markdown content of a specific path.
    - `WRITE_MEMORY_FILE`: Save Markdown content to a specified path.
- [ ] **Security**: Ensure file operations are restricted to the `memory/` folder (prevent path traversal).

## Phase 2: Memory Dashboard (Frontend)
- [ ] **`MemoryService`**: Implement a TypeScript service to communicate with the backend commands.
- [ ] **`MemoryExplorer` component**:
    - A glass-panel sidebar for browsing the directory structure.
    - Folder expansion/collapsion.
    - File selection.
- [ ] **`CortexEditor` component**:
    - A premium Markdown editor using a lightweight library (e.g., `react-simplemde-editor` or a custom `textarea` with `react-markdown` preview).
    - Syntax highlighting for code blocks.
    - Auto-save functionality linked to the backend.
- [ ] **View Integration**: Add a "MEMORY" tab to the main `App.tsx` layout.

## Phase 3: Semantic Integration
- [ ] **Graph-to-Note Linkage**: Clicking a node in the `SemanticGraphView` should open the corresponding Markdown file in the `CortexEditor`.
- [ ] **Cross-Linking**: Implement a way to follow internal links (e.g., `[[note]]`) within the native editor.

## Phase 4: Visual & UX Excellence
- [ ] **Transitions**: Use `framer-motion` for smooth layout shifts between Telemetry, Graph, and Memory views.
- [ ] **Neural HUD**: Enhance the "Holographic" aesthetic with scanlines, subtle flickers, and premium typography.

## Success Criteria
1.  **Zero Obsidian dependency**: All documentation can be created, edited, and linked within `sogna-web`.
2.  **Unified Context**: The graph view and memory notes are bi-directionally linked.
3.  **Portability**: The dashboard works out-of-the-box as soon as `Sogna_App.vbs` is running.
