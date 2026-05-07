## Design System: SOGNA INSTITUTIONAL INTERFACE

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

### Key Effects

Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus

### Avoid (Anti-patterns)

- Generic tech design
- No viz

### Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

### Design Tokens (CSS)

```css
:root {
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
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --density-scale: 1.0;
  --base-gap: calc(1rem * var(--density-scale));
  --base-padding: calc(1.5rem * var(--density-scale));
}
```
