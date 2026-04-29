# Landing Page Redesign — Spec

**Date:** 2026-04-28
**Branch:** feature/billing-model (to be implemented on a new branch)
**Source design:** Google Stitch — "AI Certification Engine" project

---

## Goal

Replace the current 7-section landing page with the cleaner 3-section structure from the Stitch design. Update the shared navbar and footer to match. All changes use existing HeroUI tokens (no hardcoded colors), respect the flat design rules in `app/CLAUDE.md`, and preserve i18n.

---

## Files Changed

| File | Change |
|---|---|
| `app/page.tsx` | Full rewrite — 3 sections |
| `sharedComponents/ui/navbar.tsx` | New style + Product dropdown |
| `sharedComponents/ui/footer.tsx` | Rewrite with Stitch layout |

---

## 1. Navbar (`sharedComponents/ui/navbar.tsx`)

### Layout
Fixed top, full width, `bg-background/95 border-b border-divider`. No backdrop-blur (flat design rule).

### Logo
FontAwesome `faBrain` icon in `text-primary` + "MyQuiz" in `font-bold tracking-tight text-foreground`.

### Nav links
| Label | Behavior |
|---|---|
| Product | Dropdown (HeroUI Dropdown) |
| Solutions | Anchor `#` (placeholder) |
| Pricing | Anchor `#` (placeholder) |
| Docs | Anchor `#` (placeholder) |

**Product dropdown items:**
- Quiz → `/quiz`
- Generate Questions → `/generate-questions`
- Configure Certification → `/configure-certification`

### Actions (right side)
- "Log In" — text link, `text-default-500 hover:text-foreground`
- "Start Free Trial" — `bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-medium` → `/quiz`

### Mobile
Preserve existing hamburger menu behavior. Product dropdown items shown inline in mobile menu.

### i18n keys needed
```
nav.product=Product
nav.solutions=Solutions
nav.pricing=Pricing
nav.docs=Docs
nav.logIn=Log In
nav.startFreeTrial=Start Free Trial
nav.quiz=Quiz
nav.generateQuestions=Generate Questions
nav.configureCertification=Configure Certification
```

---

## 2. Landing Page (`app/page.tsx`)

`'use client'` — uses `useTranslation`.

Sections rendered in order:
1. `HeroSection`
2. `TrustedBySection`
3. `FeaturesSection`

Remove: `StatsSection`, `CertificationsSection`, `TestimonialsSection`, `CompaniesSection`, `CtaSection`.

Remove data arrays: `STATS`, `CERTIFICATIONS`, `TESTIMONIALS`.

Keep: `FEATURES` array (reused in FeaturesSection). `COMPANIES` array (reused in TrustedBySection).

---

### 2a. HeroSection

Two-column layout on md+, stacked on mobile.

```
<section> (py-20 px-6)
  <div max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12>
    <!-- Left col: 5/12 -->
    <div flex flex-col gap-6>
      <badge pill>        — "v2.0 Beta Live"
      <h1>               — homepage.hero.headline
      <p>                — homepage.hero.description
      <div flex gap-4>
        <Button primary>  — "Start Your Free Trial" → /quiz
        <Button bordered>  — "View Sample Questions" → /generate-questions
    <!-- Right col: 7/12 -->
    <div>
      <AppMockup />      — styled component (no external image)
```

**Badge pill:** `bg-content1 border border-divider rounded-full px-3 py-1.5 flex items-center gap-2` with a `w-2 h-2 rounded-full bg-primary` dot + label text `text-xs uppercase tracking-widest text-default-500`.

**H1:** `text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground`

**AppMockup component** (inline in `page.tsx`, not extracted):
- Container: `bg-content1 border border-divider rounded-xl overflow-hidden aspect-[4/3] relative`
- Faux browser chrome: top bar `bg-content2 border-b border-divider h-8 flex items-center px-4 gap-2` with 3 `w-2.5 h-2.5 rounded-full bg-default-300` dots
- Body: dark surface with syntax-highlighted fake code lines using Tailwind spans (indigo/cyan/amber text colors hardcoded only for decorative code mock — not semantic UI)
- Floating badge bottom-right: `absolute bottom-4 right-4 bg-content2 border border-divider rounded-lg p-3 flex flex-col gap-0.5`
  - Label: `text-xs text-primary font-medium` — "Analysis Complete"
  - Value: `text-xs font-mono text-foreground` — "Confidence: 94.2%"

### i18n keys needed
```
homepage.hero.badge=v2.0 Beta Live
homepage.hero.headline=Master Your Next Certification with AI-Powered Precision.
homepage.hero.description=Generate high-fidelity practice questions for AWS, SAP, and GCP. Tailored to your knowledge gaps, designed for the modern architect.
homepage.cta.startFreeTrial=Start Your Free Trial
homepage.cta.viewSampleQuestions=View Sample Questions
```

---

### 2b. TrustedBySection

Narrow strip between Hero and Features.

```
<section> (border-y border-divider bg-content1/50 py-10 px-6)
  <div max-w-5xl mx-auto flex flex-col items-center gap-6>
    <span label>  — "Trusted by engineers at"
    <div flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale>
      {COMPANIES.map}  — company name as styled text
```

Reuse `COMPANIES` array from current `page.tsx`. Each entry rendered as `<span className="text-lg font-black tracking-tight" style={{ color: company.color }}>`.

### i18n keys needed
```
homepage.trustedBy=Trusted by engineers at
```

---

### 2c. FeaturesSection

Bento-style 3-column grid.

```
<section> (py-20 px-6)
  <div max-w-6xl mx-auto>
    <grid grid-cols-1 md:grid-cols-3 gap-6>
      {FEATURES.map => FeatureCard}
```

Each card:
- `bg-content1 border border-divider rounded-xl p-6 flex flex-col gap-4 hover:border-default-300 transition-colors duration-200`
- Icon box: `w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center`
- Icon: FontAwesome — `faRobot` (AI), `faFileLines` (Explanations), `faRoute` (Study Paths) — `text-primary text-sm`
- H3: `text-lg font-bold text-foreground`
- P: `text-sm text-default-500 leading-relaxed`

Reuse existing `FEATURES` array and i18n keys (`homepage.features.ai.*`, etc.).

---

## 3. Footer (`sharedComponents/ui/footer.tsx`)

`'use client'` — uses `useTranslation`.

```
<footer> (border-t border-divider bg-background py-10 px-6)
  <div max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6>
    <span>  — "MyQuiz" uppercase bold tracking-widest text-sm text-foreground
    <div flex flex-wrap justify-center gap-6>
      <a> Privacy Policy
      <a> Terms of Service
      <a> Security
      <a> Status
    <span>  — "© 2025 MyQuiz AI. Precision-engineered for technical mastery."
```

Link style: `text-xs text-default-400 hover:text-default-600 transition-colors`.
Copyright: `text-xs text-default-400`.

### i18n keys needed
```
footer.brand=MyQuiz
footer.privacy=Privacy Policy
footer.terms=Terms of Service
footer.security=Security
footer.status=Status
footer.copyright=© 2025 MyQuiz AI. Precision-engineered for technical mastery.
```

---

## Design Constraints (from `app/CLAUDE.md`)

- No `backdrop-blur-*`, no gradients, no `bg-clip-text text-transparent`
- All colors via HeroUI semantic tokens (`bg-content1`, `text-default-500`, etc.)
- Exception: decorative code mock inside `AppMockup` may use literal color classes (indigo/cyan/amber) since it is purely illustrative, not semantic UI
- HeroUI components for all interactive elements (Dropdown, Button, Link)
- All visible strings via `t('key')` — no hardcoded UI text

---

## i18n Summary

Add to both `public/messages/en.properties` and `public/messages/pt.properties`:

**Navbar:** `nav.product`, `nav.solutions`, `nav.pricing`, `nav.docs`, `nav.logIn`, `nav.startFreeTrial`, `nav.quiz`, `nav.generateQuestions`, `nav.configureCertification`

**Hero:** `homepage.hero.badge`, `homepage.hero.headline`, `homepage.hero.description`, `homepage.cta.startFreeTrial`, `homepage.cta.viewSampleQuestions`

**Trusted By:** `homepage.trustedBy`

**Footer:** `footer.brand`, `footer.privacy`, `footer.terms`, `footer.security`, `footer.status`, `footer.copyright`

Existing keys to keep (used in FeaturesSection): `homepage.features.ai.*`, `homepage.features.topics.*`, `homepage.features.answers.*`

Existing keys no longer used on the page (safe to keep in .properties, just unused): all `homepage.stats.*`, `homepage.certifications.*`, `homepage.testimonials.*`, `homepage.companies.*`, `homepage.cta2.*`
