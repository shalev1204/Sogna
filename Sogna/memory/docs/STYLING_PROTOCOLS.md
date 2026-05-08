# STYLING_PROTOCOLS: The Sogna Visual Standard

This document defines the institutional aesthetic of the Sogna Ecosystem. All autonomous project deployments must adhere to these standards.

## 1. Core Visual Principles

- **Clarity over Complexity**: UI must be intuitive and legible at first glance.
- **Institutional Polish**: Use smooth transitions, consistent spacing, and premium color palettes.
- **Kinetic Feedback**: Every interaction must have a kinetic response (Animator engine).
- **Component Integrity**: Use Assembler components to maintain structural consistency.

## 2. Global Styling Tokens

| Category | Token Strategy |
|----------|----------------|
| **Typography** | Always use Google Fonts (Inter/Outfit for UI, Serif for Brand). |
| **Colors** | Strictly follow the `Stylist` reasoning for each industry. |
| **Shadows** | Use layered shadows for depth (`--shadow-md`, `--shadow-lg`). |
| **Transitions** | Global default: `200ms ease-out`. |

## 3. The "Unicorn" Checklist (Pre-Delivery)

- [ ] **Iconography**: No emojis as icons. Use SVG (Lucide/Heroicons).
- [ ] **Interactive**: `cursor-pointer` on all clickable elements.
- [ ] **Animations**: Smooth transitions (150-300ms) on hover/focus.
- [ ] **Accessibility**: Contrast ratio 4.5:1 minimum; focus states visible.
- [ ] **Responsiveness**: Verified at 375px, 768px, 1024px, 1440px.

## 4. Industry-Specific Reasoning (Stylist)

Sogna uses the `Stylist` engine to determine the "vibe" based on 161 industries.

- **Fintech**: High trust, blue/slate tones, strict grids, subtle micro-interactions.
- **SaaS**: High clarity, vibrant accents, bento-grid layouts, aurora backgrounds.
- **Luxury**: High elegance, serif typography, generous white space, gold/charcoal accents.

## 5. Prohibited Anti-Patterns

- ❌ **AI Gradients**: No generic "AI-generated" purple/pink gradients.
- ❌ **Harsh Motion**: No bouncy or jittery animations.
- ❌ **Layout Chaos**: No inconsistent spacing or misaligned grids.
- ❌ **Light Mode Default**: Unless explicitly requested, default to the institutional **Dark Mode (OLED)** for power efficiency and high-fidelity aesthetics.

---
*"The quality of the UI is the signature of the Sogna creator."*
