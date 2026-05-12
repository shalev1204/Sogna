## Design System: SOGNA DEFAULT WORLD

### Pattern
- **Name:** Hero + Features + CTA
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style
- **Name:** Minimalism

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#2563EB` | `--color-primary` |
| Secondary | `#3B82F6` | `--color-secondary` |
| Accent/CTA | `#F97316` | `--color-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#1E293B` | `--color-foreground` |

### Typography
- **Heading:** Inter
- **Body:** Inter

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
  --color-primary: #2563EB;
  --color-secondary: #3B82F6;
  --color-accent: #F97316;
  --color-background: #F8FAFC;
  --color-foreground: #1E293B;
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

