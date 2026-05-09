## Design: SOGNA INTERFACE

### Pattern

- **Name:** Immersive + Interactive
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style

- **Name:** Dark Mode (OLED)
- **Mode Support:** Light Ô£ù No | Dark Ô£ô Only
- **Keywords:** Dark theme, low light, high contrast, deep black, midnight blue, eye-friendly, OLED, night mode, power efficient
- **Best For:** Night-mode apps, coding platforms, entertainment, eye-strain prevention, OLED devices, low-light
- **Performance:** ÔÜí Excellent | **Accessibility:** Ô£ô WCAG AAA

### Colors

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#00FFFF` | `--color-primary` |
| On Primary | `#0F172A` | `--color-on-primary` |
| Secondary | `#7B61FF` | `--color-secondary` |
| Accent/CTA | `#FF00FF` | `--color-accent` |
| Background | `#050510` | `--color-background` |
| Foreground | `#E0E0FF` | `--color-foreground` |
| Muted | `#1D1D28` | `--color-muted` |
| Border | `#333344` | `--color-border` |
| Destructive | `#EF4444` | `--color-destructive` |
| Ring | `#00FFFF` | `--color-ring` |

*Notes: Quantum cyan + interference purple*

### Typography

- **Heading:** Inter
- **Body:** Inter
- **Mood:** Futuristic + Scientific typography

### Key Effects (Premium Layer)

- **Glassmorphism**: `backdrop-filter: blur(12px) saturate(180%); background: rgba(5, 5, 16, 0.7);`
- **Glow**: Minimal cyan glow (`text-shadow: 0 0 10px var(--color-primary)`).
- **Motion (SognaFlow)**: 
  - Standard Ease: `cubic-bezier(0.4, 0, 0.2, 1)` (300ms)
  - Entrance: `backOut` for cards (duration: 0.5s)
  - Hover Scale: `1.02` with spring physics.

### Design Tokens (CSS)

```css
:root {
  /* Colors */
  --color-primary: #00FFFF;
  --color-on-primary: #0F172A;
  --color-secondary: #7B61FF;
  --color-accent: #FF00FF;
  --color-background: #050510;
  --color-foreground: #E0E0FF;
  --color-muted: #1D1D28;
  --color-border: #333344;
  --color-destructive: #EF4444;
  --color-ring: #00FFFF;
  
  /* Glassmorphism */
  --glass-bg: rgba(5, 5, 16, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(12px);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Animation (SognaFlow Tokens) */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```
