## Design System: SOGNA DEFAULT WORLD

### Pattern

- **Name:** Feature-Rich Showcase
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style

- **Name:** Vibrant & Block-based
- **Mode Support:** Light ✓ Full | Dark ✓ Full
- **Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic
- **Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer
- **Performance:** ⚡ Good | **Accessibility:** ◐ Ensure WCAG

### Colors

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#D97706` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#F59E0B` | `--color-secondary` |
| Accent/CTA | `#6366F1` | `--color-accent` |
| Background | `#0F172A` | `--color-background` |
| Foreground | `#FFFFFF` | `--color-foreground` |
| Muted | `#1F1E27` | `--color-muted` |
| Border | `rgba(255,255,255,0.08)` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#D97706` | `--color-ring` |

*Notes: Time amber + night indigo on dark*

### Typography

- **Heading:** Roboto
- **Body:** Roboto
- **Mood:** material design 3, md3, android, google, tonal, friendly, rounded, accessible, adaptive
- **Best For:** Android apps, cross-platform tools, productivity software, data-heavy B2B dashboards, enterprise mobile
- **Google Fonts:** https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400
- **CSS Import:**

```css
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');
```

### Key Effects

Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Avoid (Anti-patterns)

- Flat design without depth
- Text-heavy pages

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
  --color-primary: #D97706;
  --color-on-primary: #FFFFFF;
  --color-secondary: #F59E0B;
  --color-accent: #6366F1;
  --color-background: #0F172A;
  --color-foreground: #FFFFFF;
  --color-muted: #1F1E27;
  --color-border: rgba(255,255,255,0.08);
  --color-destructive: #DC2626;
  --color-ring: #D97706;
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
