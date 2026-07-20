---
name: CertifiqueAI Design System
colors:
  # Dark theme (default) — navy + amber-orange
  background:           '#09112a'
  background2:          '#070e20'
  content1:             '#0c1832'
  content2:             '#10203c'
  foreground:           '#e8edf3'
  primary:              '#e07820'
  primary-foreground:   '#ffffff'
  primary-dim:          '#c4641a'
  secondary:            '#f59e0b'
  secondary-foreground: '#000000'
  accent:               '#00d4ff'
  # Semantic
  danger:               '#e05252'
  success:              '#3db87a'
  warning:              '#d4a012'
  # Borders & dividers
  divider:              '#1a2d52'
  default-200:          '#10203c'
  default-300:          '#1a2d52'
  default-400:          '#4d87bc'
  default-500:          '#6a9fc8'
  # Light theme overrides (for semantic tokens only)
  light-background:     '#f8fafc'
  light-background2:    '#eef2f6'
  light-content1:       '#ffffff'
  light-content2:       '#f1f5f9'
  light-foreground:     '#0f172a'
  light-primary:        '#4f46e5'
  light-primary-fg:     '#ffffff'
typography:
  display:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.15'
    letterSpacing: -0.03em
  h1:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label:
    fontFamily: Fira Code
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.08em
  mono:
    fontFamily: Fira Code
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  container-max: 1200px
---

## Brand & Style

CertifiqueAI is built for serious certification and concurso preparation. The visual language is **terminal-native dark**: deep navy surfaces, a warm amber-orange accent, and Fira Code monospace for all technical labels and data values. The warm-cool contrast (amber on navy) is grounded and readable without the harshness of electric cyan. Sora is reserved for brand headings and display moments. Inter handles all body and UI text.

The result is a tool that looks like it was purpose-built for precision — not a generic SaaS dashboard wearing dark mode as a setting.

## Color System

### Dark theme (primary surface — default for workspace)

The dark theme uses the same navy palette as the marketing page:

| Token | Value | Use |
|---|---|---|
| `bg-background` | `#09112a` | Page background |
| `bg-background2` | `#070e20` | Sidebar, header surfaces |
| `bg-content1` | `#0c1832` | Cards, panels |
| `bg-content2` | `#10203c` | Nested surfaces, table rows |
| `text-foreground` | `#e8edf3` | Primary text |
| `text-default-500` | `#6a9fc8` | Secondary text |
| `text-default-400` | `#4d87bc` | Muted / tertiary text |
| `text-primary` | `#e07820` | Accent (amber-orange) — active states, CTAs, links |
| `border-divider` | `#1a2d52` | Borders, separators |

### Light theme

| Token | Value | Use |
|---|---|---|
| `bg-background` | `#f8fafc` | Page background |
| `bg-background2` | `#eef2f6` | Sidebar, header |
| `bg-content1` | `#ffffff` | Cards |
| `text-primary` | `#4f46e5` | Indigo accent (active states, CTAs) |

Light mode intentionally keeps indigo as primary — it provides better contrast on white than amber-orange would.

### Semantic colors (both themes)

```
bg-primary / text-primary   → action accent (amber-orange dark / indigo light)
bg-danger  / text-danger    → destructive, errors
bg-warning / text-warning   → quota warnings, caution states
bg-success / text-success   → correct answers, completion
```

**Rules:**
- Use semantic tokens everywhere. Never hard-code `#e07820` in components — use `text-primary` / `bg-primary`.
- `bg-primary/10` + `text-primary` = active nav state.
- Progress bars: `bg-primary` (normal) → `bg-warning` (>70%) → `bg-danger` (>90%).
- No gradients. No glassmorphism. All surfaces use solid fills.

## Typography

Three families, three distinct roles:

| Family | Variable | Role |
|---|---|---|
| **Sora** | `font-sora` | Brand logotype, display headings, section h2/h3 on marketing surfaces |
| **Inter** | `font-sans` | All UI body text, labels, buttons, form fields, nav items |
| **Fira Code** | `font-mono` | Section kicker labels, data values, counters, technical copy |

### Hierarchy in the workspace

```
Brand logotype       → font-sora font-semibold text-sm text-foreground
Page title           → .page-header-title (2rem, 800, Inter, text-foreground)
Section heading      → text-xl font-bold text-foreground (Inter)
Section kicker label → font-mono text-xs text-default-400 uppercase tracking-widest (Fira Code)
Nav item             → text-sm text-default-500 (Inter)
Body / description   → text-sm text-default-500 (Inter)
Metadata / counter   → text-xs text-default-400 font-mono (Fira Code)
```

**Rules:**
- `font-sora` is only for the brand logotype in the sidebar/header and for `<h1>`/`<h2>` headings on marketing surfaces. Do not use it in buttons, labels, or body copy.
- Section kicker labels (e.g. admin SETTINGS divider, nav group headers) always use `font-mono text-xs uppercase tracking-widest`.
- Data values in usage counters always use `font-mono` weight/size.

## Layout & Spacing

- **App shell:** Sidebar `w-64 sticky h-screen` + `WorkspaceHeader h-14` + main content.
- **Container:** `max-w-7xl mx-auto px-6` inside `PageHeader`.
- **Card standard:** `bg-content1 border border-default-200 rounded-xl p-6`.
- **Spacing rhythm:** 4px base, standard increments 8px / 16px / 24px / 48px. Nav gaps: `gap-0.5`.

## Components

### Buttons

All class strings live in `config/constants/buttonStyles.ts`. Never repeat inline.

| Variant | Style |
|---|---|
| Primary | `bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90` |
| Secondary | `variant="bordered"` + secondary className |
| Flat | `bg-default-100 border border-default-200` |
| Danger | `bg-danger text-white` |

**Rules:** Never use `color=` on `<Button>`. Never `variant="ghost"`, `"solid"`, or `"shadow"`. Icon-only requires `isIconOnly` + `size="sm"` + `aria-label`.

### Cards

```tsx
<div className="bg-content1 border border-default-200 rounded-xl p-6">
```

### Nav active state

```
Active top-level:  bg-primary/10 text-primary font-semibold rounded-lg
Active sub-item:   bg-primary/10 text-primary font-semibold rounded-lg
Hover state:       hover:bg-default-100 hover:text-foreground
```

### Inputs

Always via `inputProperties` spread from `config/constants/inputStyles.ts`. `variant="bordered"`, `rounded-lg`, focus border `border-primary`.

### Chips / Badges

Always `size="sm"`. Color via `color=` prop only. Never override size via className.

### Usage progress bar

```
Normal  (≤70%) → bg-primary
Warning (>70%) → bg-warning
Danger  (>90%) → bg-danger
Track          → bg-default-200
```

## Elevation

Depth via tonal layering, never shadows:

| Level | Token | Value (dark) |
|---|---|---|
| Page bg | `bg-background` | `#09112a` |
| Sidebar / header | `bg-background2` | `#070e20` |
| Cards / panels | `bg-content1` | `#0c1832` |
| Nested surfaces | `bg-content2` | `#10203c` |

## Shapes

- Inputs & selects: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Cards & containers: `rounded-xl` (12px)
- Tags & badges: `rounded-full`
- Nav items: `rounded-lg`

## Motion

- State transitions: `transition-colors duration-200` (nav hover, input focus)
- Accordion chevron: `transition-transform duration-200`
- Marketing page has richer motion (marquee, scan-line, cursor blink) — workspace uses minimal transitions only.
- Always include `@media (prefers-reduced-motion: reduce)` for anything beyond `transition-colors`.

## Rules (never violate)

- No gradients (`bg-gradient-to-*`, `from-*`, `via-*`, `to-*`)
- No glassmorphism (`backdrop-blur-*`)
- No gradient text (`bg-clip-text text-transparent`)
- No hard-coded hex values in components — use semantic tokens
- No colored shadows
- No hover lifts (`hover:-translate-y-*`)
- `font-sora` only for brand logotype and marketing headings
- `font-mono` for all section kicker labels and data counters
