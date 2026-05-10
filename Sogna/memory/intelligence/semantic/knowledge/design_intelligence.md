---
swarm: Core
project: Sogna
---

# Sogna Design Intelligence: The Bible

This document consolidates the industrial-grade UI/UX, motion kinetic, and architectural intelligence absorbed from the global ecosystem. It serves as the primary reasoning base for Sognatore and the Stylist motor.

## 1. Philosophy: The Kinetic Minimalism

Sogna interfaces are not static; they are living flows. Every interaction must feel weighted, purposeful, and fluid.

- **Rhythm**: UI elements should appear in a staggered sequence (0.05s offset).
- **Surface**: Use depth (Glassmorphism/Z-index) to signify hierarchy, not just color.
- **Pulse**: Micro-animations should follow the `[0.23, 1, 0.32, 1]` cubic-bezier (Sogna Pulse).

## 2. Industrial Design Reasoning

Based on 161 industrial rules, Sognatore must prioritize:

- **Financial/Critical Systems**: High contrast, strict alignment, immediate feedback, low motion (High Severity Rules).
- **Creative/Social Systems**: Fluid transitions, vibrant gradients, staggered entries, expressive typography (Medium Severity Rules).
- **Utility/Dashboards**: Data density over aesthetics, accessible chart types (A11y Grade A), performance-first rendering.

## 3. The Stylist Vocabulary (Nativization)

Eliminate external branding. Use these native terms:
| Legacy Term | Sogna Native | Context |
|-------------|--------------|---------|
| Graphify    | Navigator    | Architectural Graphing |
| Motion      | SognaFlow    | Kinetic Animation |
| 21st SDK    | Assembler    | Component Synthesis |
| Dark Mode   | Sogna Void   | Visual Style |
| Light Mode  | Sogna Ether  | Visual Style |

## 4. Kinetic Standards (SognaFlow)

Animations must be categorized by their intent:

- **Intake**: Elements entering the viewport (`fadeUp`, `scaleIn`).
- **Interaction**: Elements reacting to user input (`subtleHover`, `activePress`).
- **Focus**: Drawing attention to critical errors or CTAs (`jigglePulse`).

## 5. Architectural Integrity

- **Data Integrity**: Design decisions are made locally using `ui-reasoning.csv`.
- **Structural Integrity**: Validated via architecture_report.md and UMA benchmarks.
- **Component Evolution**: Components in `toolkit/Assembler` must inherit tokens from the Stylist's `:root` system.

## 6. The Guardian: Performance & UX Auditing

The Guardian engine (Stylist) enforces 99 UX guidelines and 46 performance rules to ensure technical and perceptual excellence.

### UX Critical Standards

- **Wait Time Visibility**: For any operation > 1s, a progress indicator is mandatory.
- **Error Recovery**: Every error message must provide an actionable next step, not just a failure code.
- **Touch Targets**: All interactive elements must have a minimum hit area of 44x44px for mobile integrity.
- **Hierarchy of Action**: Primary actions must be visually distinct from secondary ones through weight and elevation.

### Performance Optimization (React/Next.js)

- **Render Purging**: Avoid anonymous functions in props; use `useCallback` for event handlers.
- **Layout Thrashing**: Prefer `transform` and `opacity` for animations; avoid animating `width`, `height`, or `top`.
- **Dynamic Ingestion**: Large assets must be lazy-loaded with skeleton placeholders.
- **State Isolation**: Keep state as local as possible to avoid unnecessary tree re-renders.

---
*End of Sogna Design Intelligence - Master Record*
