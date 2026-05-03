# Sogna Agentic UI Blueprint

## Overview
Defines the native structure for rendering agential interactions and tool execution within Sogna-generated applications.

## Components

### 1. ToolRenderer (Native)
- **Purpose**: Displays tool calls, arguments, and results in a structured, readable format.
- **Styling**: Uses `--color-muted` for background and `--color-primary` for the "Action" label.
- **Behavior**: Collapsible by default if the result is long.

### 2. ReasoningChain
- **Purpose**: Visualizes the internal "thought" process of the agent.
- **Styling**: Italicized text with a subtle border left (`--color-secondary`).
- **Interaction**: Animated "typing" effect for active reasoning.

### 3. AgentStatus
- **Purpose**: Displays the current permission level and status of the active engine.
- **Badge Colors**:
  - `Level 0`: Grey
  - `Level 1`: Blue
  - `Level 2`: Orange
  - `Level 3`: Purple (Elevated)

## Usage Protocol
All UI components must be synthesized by `Assembler` using the tokens provided by `Stylist`.
- Use `--density-scale` to adjust component height and text size dynamically.
- Use `--base-padding` for consistent spacing in tool results.

---
*Status: INSTITUTIONAL*
