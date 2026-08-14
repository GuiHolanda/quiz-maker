# Marketing Route Group — Industry Light Design System

This route group (`app/(marketing)/`) uses the **Industry light** design system, which differs completely from the dark HeroUI workspace theme. Read this before editing any component here.

---

## Design Language

- Flat, square, light surfaces
- No gradients, no blur, no glassmorphism, no rounded corners
- Blueprint aesthetic: crosshair corner marks on key cards
- Gap trick for hairline dividers (no `border` properties — use outer bg + `gap-px`)

---

## CSS Scope

All tokens live under `.marketing-ds` in `shared/styles/globals.css`. The layout wrapper (`app/(marketing)/layout.tsx`) applies this class, so all children inherit the tokens via CSS variables.

**Never use HeroUI semantic tokens** (`bg-content1`, `text-foreground`, `border-divider`, etc.) inside this route group — they resolve to dark workspace values.

---

## Color Tokens

| Variable | Value | Use |
|---|---|---|
| `--color-bg` | `#f2f2f3` | Page background, primary card background |
| `--color-surface` | `#e9e9ea` | Secondary surface, alternating section bg |
| `--color-text` | `#1d1f20` | All body text |
| `--color-accent` | `#5980a6` | Steel blue — CTAs, step 01 border, kick labels |
| `--color-accent-700` | `oklch(35% 0.08 220)` | Darker accent for numbered labels |
| `--color-accent-100` | `oklch(93% 0.03 220)` | Light accent tint — featured card bg, correct option bg |
| `--color-divider` | `color-mix(in srgb, #1d1f20 16%, transparent)` | Gap trick outer bg, border lines |

Use via Tailwind: `bg-mkt-bg`, `text-mkt-text`, `border-mkt-divider`, etc. (definidos em `tailwind.config.mjs` como `theme.extend.colors.mkt.*`). Evite `[var(--color-*)]` — use sempre os tokens `mkt-*`.

---

## Typography

| Class | Font | Use |
|---|---|---|
| `.ds-heading` | Barlow Condensed 600 | All headings (`h1`–`h3`), section titles |
| `.kick` | ui-monospace, 11px, uppercase, tracking-widest, `--color-accent` | Section kicker labels above headings |
| `.mono` | ui-monospace | Numbers, timers, stat values, social proof counts |

Fonts loaded via `next/font/google` in `config/fonts.ts`, injected as `--font-barlow` and `--font-barlow-condensed` CSS variables.

---

## Blueprint Corners

Key cards use crosshair corner marks to reinforce the technical aesthetic.

**Usage:**
```tsx
import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

<div className="blueprint">
  <BlueprintCorners />
  {/* card content */}
</div>
```

The `.blueprint` class (in `globals.css`) applies `position: relative`, `border: 1px solid var(--color-divider)`, `border-radius: 0`. The four `<span>` children render crosshair marks via `::before`/`::after` positioned at `-6px` offsets on each corner.

**Dark section override:** inside `SimuladosDarkSection` (dark bg), corner colors must be overridden with inline styles since the CSS vars resolve to light values.

---

## Gap Trick (Hairline Dividers)

Creates 1px divider lines between cells without explicit `border` on each cell.

```tsx
{/* Outer: bg = divider color */}
<div className="bg-[var(--color-divider)] grid grid-cols-3 gap-px">
  {/* Each cell: bg = surface color, gap-px reveals the outer color */}
  <div className="bg-[var(--color-bg)] p-6">...</div>
  <div className="bg-[var(--color-bg)] p-6">...</div>
  <div className="bg-[var(--color-bg)] p-6">...</div>
</div>
```

Used in: `StatsStrip`, `CertificationsSection` 2×2 grid, `FeaturesSection` 3-column, `HomepagePricingSection` 2-column, `ProgressSection` stats row.

---

## Section Background Alternation

| Section | Background |
|---|---|
| Hero, CertificationsSection, FeaturesSection, ProgressSection | `bg-[var(--color-bg)]` |
| ConcursosSection, QualitySection, FaqSection | `bg-[var(--color-surface)]` |
| SimuladosDarkSection | `style={{ background: '#162232' }}` (only dark section) |
| HomepagePricingSection | `bg-[var(--color-bg)]` |
| CtaSectionShell | `bg-[var(--color-surface)]` |

All sections use `border-t border-[var(--color-divider)]` to separate from the preceding section.

---

## Component Inventory

| Component | Type | Notes |
|---|---|---|
| `BlueprintCorners.tsx` | Primitive | 4 crosshair spans; always inside a `.blueprint` element |
| `HeroQuestionCard.tsx` | Section | Static AWS question demo card with blueprint corners |
| `HeroStaticContent.tsx` | Section | Headline, description, CTA, social proof avatars |
| `HeroCta.tsx` | Interactive | Session-aware CTA buttons (square, no rounded) |
| `StatsStrip.tsx` | Section | 4-stat gap-trick row |
| `CertificationsSection.tsx` | Section | Featured domain + 2×2 gap-trick grid |
| `ConcursosSection.tsx` | Section | Left/right blueprint panels + areas band |
| `FeaturesSection.tsx` | Section | 3-column numbered gap-trick grid |
| `HowItWorksSection.tsx` | Section | Border-top step columns (step 01 accent, 02–04 muted) |
| `SimuladosDarkSection.tsx` | Section | Only dark section on the page; inline styles for dark context |
| `ProgressSection.tsx` | Section | Bar chart blueprint card + 3-stat gap-trick row |
| `QualitySection.tsx` | Section | 3-column generation/verification grid |
| `HomepagePricingSection.tsx` | Section | 2-card gap-trick (Free / Pro), session-aware CTA |
| `FaqSection.tsx` | Section | HeroUI Accordion with light itemClasses |
| `CtaSectionCta.tsx` | Interactive | Final CTA with blueprint-wrapped primary button |

---

## Square Rule

**No `rounded-*` classes anywhere in this route group.** Buttons, cards, chips, inputs — all square. This is a hard constraint of the Industry design system.
