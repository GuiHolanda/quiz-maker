---
name: Technical Precision
colors:
  surface: '#13121b'
  surface-dim: '#13121b'
  surface-bright: '#393842'
  surface-container-lowest: '#0e0d16'
  surface-container-low: '#1b1b24'
  surface-container: '#1f1f28'
  surface-container-high: '#2a2933'
  surface-container-highest: '#35343e'
  on-surface: '#e4e1ee'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#e4e1ee'
  inverse-on-surface: '#302f39'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#13121b'
  on-background: '#e4e1ee'
  surface-variant: '#35343e'
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
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
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
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

The design system is engineered for deep focus and cognitive clarity, tailored specifically for technical professionals preparing for high-stakes IT certifications. It prioritizes information density without clutter, drawing inspiration from high-performance developer tools like Vercel and Linear.

The style is **Minimalist-Tactile**. It eschews decorative flourishes, background gradients, and soft shadows in favor of structural integrity, crisp borders, and subtle physical feedback. The interface should feel like a high-end instrument—precise, reliable, and invisible until needed. The emotional response is one of serious intent and professional readiness.

## Colors

The design system operates on a high-contrast dark-first foundation. The palette is dominated by deep charcoal and black tones to reduce eye strain during long study sessions.

- **Primary:** Indigo 600 is the sole driver of action and focus. It is used sparingly for primary buttons, active states, and progress indicators.
- **Neutrals:** A monochromatic scale derived from Zinc/Slate. Surfaces are layered using solid fills rather than shadows to define hierarchy.
- **Accents:** Semantic colors for success (correct answers) and error (incorrect answers) are highly saturated to provide immediate, unambiguous feedback.
- **No Gradients:** All surfaces use solid fills to maintain a flat, modern, and high-performance technical aesthetic.

## Typography

The design system utilizes **Inter** for all interface elements to ensure maximum readability and a systematic, utilitarian feel.

Hierarchy is established through weight and color rather than excessive scale. Headlines use tighter letter-spacing and heavier weights for a "locked-in" appearance. For code snippets or technical configuration examples within quiz questions, a standard monospaced font is used to provide clear visual separation from instructional text. Labels are used for metadata and status badges, often presented in uppercase to differentiate from body content.

## Layout & Spacing

This design system employs a **Fixed Grid** model for dashboard and content views, ensuring that technical content remains legible and centered. A 12-column grid is used for desktop layouts, while mobile transitions to a single-column fluid layout with 16px side margins.

The spacing rhythm is built on a 4px baseline. Components are separated by standard increments (16px, 24px, 48px) to create a sense of structural rigor. Information-dense areas, such as exam lists or question banks, utilize the 'sm' (8px) spacing to keep related items grouped tightly.

## Elevation & Depth

In keeping with the "Minimal Visual Noise" requirement, this design system rejects traditional drop shadows. Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0 (Background):** Pure black or the deepest neutral (#09090B).
- **Level 1 (Cards/Sidebar):** A slightly lighter gray (#18181B) with a 1px solid border (#27272A).
- **Level 2 (Popovers/Modals):** The lightest surface (#27272A) with a more prominent border (#3F3F46).

Interactive elements like buttons use a subtle "inner shadow" or a bottom-weighted border (1px or 2px) to create a tactile, pressed-metal feel when clicked, reinforcing the technical nature of the tool.

## Shapes

The design system uses **Soft** roundedness (4px - 6px) to maintain a modern, professional appearance that feels precise but not aggressive.

- **Standard Elements:** Buttons, inputs, and checkboxes use a 4px radius (rounded-sm).
- **Containers:** Cards and larger modules use an 8px radius (rounded-md) to frame content clearly.
- **Form Controls:** Checkboxes and radio buttons maintain sharp/slightly rounded corners to align with the technical SaaS aesthetic, avoiding the "bubbly" look of consumer apps.

## Components

### Buttons
- **Primary:** Solid Indigo 600 fill, White text. Tactile effect: 1px bottom border in a darker shade for a "raised" look.
- **Secondary:** Transparent fill, 1px Gray 700 border. Subtle hover fill change to Gray 800.
- **Ghost:** No border, Indigo text. Used for secondary navigation or "Cancel" actions.

### Cards
- Background: Surface Gray (#18181B).
- Border: 1px solid (#27272A).
- No shadow. Content padding: 24px.

### Badges (Usage/Plans)
- Small, uppercase labels.
- **Pro/Active:** Indigo background (10% opacity) with Indigo text.
- **Free/Standard:** Gray background (10% opacity) with Gray text.
- **Warning/Urgent:** Red background (10% opacity) with Red text.

### Form Inputs
- Background: Background Black (#09090B).
- Border: 1px solid Gray 700.
- Focus State: 1px Indigo 600 border with a subtle 2px Indigo glow (no blur).
- Text: FAFAFA for input, A1A1AA for placeholders.

### Progress Indicators
- Linear bars only. No circular loaders.
- Background track: Gray 800.
- Fill: Indigo 600.
- Use height of 4px for subtle tracking and 8px for major milestones.