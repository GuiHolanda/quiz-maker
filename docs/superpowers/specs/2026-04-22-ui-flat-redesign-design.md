# MyQuiz UI Redesign: Flat Indigo + Amber

**Date:** 2026-04-22
**Status:** Approved
**Scope:** All pages and components — homepage, auth pages, app pages, shared components, global CSS

## Problem

The current UI uses a heavy "vibe coded" aesthetic: claymorphism (backdrop-blur, multi-layer shadows), gradient text, animated gradient blobs, colored glow shadows, and gradient buttons. This makes the app look like a side project rather than a professional certification prep product.

## Design Direction

Replace all decorative styling with a flat, professional design system using:

- **Accent:** Indigo-600 (`#4f46e5`) — all primary actions, active states, focus rings
- **Secondary:** Amber-500 (`#f59e0b`) — highlights, achievements, certification badges
- **Dark background:** Slate-900 (`#0f172a`)
- **Dark surface:** Slate-800 (`#1e293b`)
- **Dark border:** Slate-700 (`#334155`)
- **Light background:** Slate-50 (`#f8fafc`)
- **Light surface:** White (`#ffffff`)
- **Light border:** Slate-200 (`#e2e8f0`)
- **Semantic:** Green-500 (correct), Red-500 (danger/wrong), Amber-500 (warning)

## What Gets Removed

1. **All gradient backgrounds** — `bg-gradient-to-*`, `from-*`, `via-*`, `to-*` on backgrounds and buttons
2. **All gradient text** — `bg-clip-text text-transparent` patterns → solid color text
3. **All glassmorphism** — `backdrop-blur-*`, `backdrop-filter`, `.clay-card`, `.clay-section`, `.clay-question-card`
4. **All decorative blobs** — animated `blur-3xl` elements on homepage and CTA section
5. **All colored shadows** — `shadow-[0_Xpx_Xpx_rgba(139,92,246,...)]` → simple `shadow-sm` or none
6. **All hover lifts** — `hover:-translate-y-*` → simple `hover:bg-*` color changes
7. **Radial gradient backgrounds** — `.auth-bg`, `.app-bg` custom CSS → flat solid colors
8. **`.page-header-title` gradient** → solid foreground color, keep font-weight

## What Gets Added

1. **HeroUI theme configuration** — configure Indigo as `primary` and Amber as `secondary` in the HeroUI plugin config in `tailwind.config.js`
2. **CSS variables** for dark/light backgrounds and surfaces — defined in `globals.css` under `:root` and `.dark`
3. **Proper light mode support** — currently dark-only with hard-coded colors; switch to semantic tokens that adapt

## Component Patterns (Post-Redesign)

### Navbar
- **Dark:** `bg-slate-900 border-b border-slate-800` (no blur, no opacity)
- **Light:** `bg-white border-b border-slate-200`
- **Active link:** `text-indigo-500` with `bg-indigo-500/10` pill (no gradient)
- **Logo icon:** solid `bg-indigo-600` (no gradient)

### Cards / Sections
- **Dark:** `bg-slate-800 border border-slate-700 rounded-xl`
- **Light:** `bg-white border border-slate-200 rounded-xl`
- No blur, no inset shadows, no multi-layer shadows

### Buttons
- **Primary:** `bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg` (no gradient, no shadow, no lift)
- **Secondary:** `border border-slate-300 dark:border-slate-600 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800`
- **Danger:** `bg-red-600 hover:bg-red-700 text-white`
- **Highlight/Accent:** `bg-amber-500 hover:bg-amber-600 text-slate-900`

### Inputs (HeroUI classNames override)
- **Dark:** `bg-slate-800 border-slate-700` → focus: `border-indigo-500`
- **Light:** `bg-white border-slate-200` → focus: `border-indigo-500`
- No inset shadows, no backdrop-blur

### Tabs
- **Container (dark):** `bg-slate-800 border border-slate-700 rounded-xl p-1`
- **Container (light):** `bg-slate-100 border border-slate-200 rounded-xl p-1`
- **Active tab cursor:** `bg-indigo-600` solid (no gradient)
- **Inactive text:** `text-slate-400 dark:text-slate-500`

### Page Headers
- **Title:** `text-foreground font-extrabold` (no gradient text)
- **Subtitle:** `text-slate-400 dark:text-slate-500`

### Question Answer States
- **Selected:** `bg-indigo-600 border-indigo-600 text-white`
- **Correct:** `bg-green-500/10 border-green-500 text-green-500` (dark) / `bg-green-50 border-green-600 text-green-700` (light)
- **Wrong:** `bg-red-500/10 border-red-500 text-red-500` (dark) / `bg-red-50 border-red-600 text-red-700` (light)

## Files to Modify

### Global
- `styles/globals.css` — remove `.auth-bg`, `.app-bg`, `.clay-card`, `.clay-section`, `.clay-question-card`, `.page-header-title` gradient. Add CSS variables for theme colors.
- `tailwind.config.js` — configure HeroUI `primary: indigo` and `secondary: amber` color tokens
- `sharedComponents/primitives.ts` — remove gradient color variants from `title()` TV config

### Homepage
- `app/page.tsx` — complete restyle: remove blobs, gradient text, gradient buttons, gradient avatars, colored shadows. Replace with flat components.

### Auth Pages
- `app/login/components/LoginForm.tsx` — remove clay-card, gradient text, gradient button, inset shadows
- `app/register/components/RegisterForm.tsx` — same treatment
- `app/forgot-password/components/ForgotPasswordForm.tsx` — same treatment
- `app/reset-password/components/ResetPasswordForm.tsx` — same treatment

### App Pages
- `app/configure-certification/page.tsx` — remove `.app-bg`, `.page-header-title`, restyle tabs
- `app/generate-questions/page.tsx` — same header treatment
- `app/quiz/page.tsx` — same header treatment

### Page Components
- `app/configure-certification/components/CertificationHeader.tsx` — restyle if using gradient/glass patterns
- `app/configure-certification/components/NewCertificationTab.tsx` — remove `.clay-section`, restyle button
- `app/configure-certification/components/EditCertificationTab.tsx` — remove `.clay-section`
- `app/configure-certification/components/CertificationsListTab.tsx` — remove clay accordion styling
- `app/configure-certification/components/TopicForm.tsx` — check for decorative patterns
- `app/quiz/components/QuizForm.tsx` — remove `.clay-section`, restyle button
- `app/quiz/components/QuestionCard.tsx` — remove `.clay-question-card`, restyle selection/submit
- `app/quiz/components/QuestionList.tsx` — check for decorative patterns
- `app/quiz/components/AnswredQuestionCard.tsx` — remove `.clay-question-card`, restyle correct/wrong states
- `app/generate-questions/components/QuestionGeneratorForm.tsx` — restyle button
- `app/generate-questions/components/GeneratedQuestionsList.tsx` — check for decorative patterns
- `app/generate-questions/components/GeneratedQuestionsCard.tsx` — remove `.clay-question-card`

### Shared Components
- `sharedComponents/ui/navbar.tsx` — remove backdrop-blur, gradient brand, colored shadows. Apply flat navbar.
- `sharedComponents/ui/BusyDialog.tsx` — check for any glass effects

## Verification

1. Run `npm run dev` and check each page in both dark and light modes
2. Verify no gradient, blur, or glassmorphism artifacts remain
3. Check that HeroUI components (Autocomplete, Select, Modal, Tabs) inherit the new primary/secondary colors
4. Verify the page is readable and the visual hierarchy is clear in both themes
5. Check responsive layouts (mobile nav, card stacking) still work
6. Search codebase for leftover patterns: `grep -r "gradient\|backdrop-blur\|clay-\|bg-clip-text" --include="*.tsx" --include="*.css"`
