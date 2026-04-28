# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page with the Stitch design (Hero 2-col + Trusted By + Features), update the shared navbar with a Product dropdown, and rewrite the footer — all using HeroUI tokens and i18n.

**Architecture:** Three independent file changes (footer, navbar, page) plus i18n keys. Footer and i18n have no dependencies on each other or the page; the navbar and page both depend on the new i18n keys, so i18n goes first. No new files are created — all changes are rewrites of existing files.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript strict, HeroUI, FontAwesome, Tailwind CSS 4, custom i18n via `.properties` files.

---

## File Map

| File | Change |
|---|---|
| `public/messages/en.properties` | Add new keys |
| `public/messages/pt.properties` | Add new keys (unicode escapes) |
| `sharedComponents/ui/footer.tsx` | Full rewrite |
| `sharedComponents/ui/navbar.tsx` | Full rewrite |
| `app/page.tsx` | Full rewrite |

---

## Task 1: Add i18n keys

**Files:**
- Modify: `public/messages/en.properties`
- Modify: `public/messages/pt.properties`

- [ ] **Step 1: Add keys to `en.properties`**

Append at the end of the file:

```properties
nav.product=Product
nav.solutions=Solutions
nav.pricing=Pricing
nav.docs=Docs
nav.logIn=Log In
nav.startFreeTrial=Start Free Trial
homepage.hero.badge=v2.0 Beta Live
homepage.hero.headline=Master Your Next Certification with AI-Powered Precision.
homepage.hero.description=Generate high-fidelity practice questions for AWS, SAP, and GCP. Tailored to your knowledge gaps, designed for the modern architect.
homepage.cta.startFreeTrial=Start Your Free Trial
homepage.cta.viewSampleQuestions=View Sample Questions
homepage.trustedBy=Trusted by engineers at
footer.brand=MyQuiz
footer.privacy=Privacy Policy
footer.terms=Terms of Service
footer.security=Security
footer.status=Status
footer.copyright=\u00A9 2025 MyQuiz AI. Precision-engineered for technical mastery.
```

- [ ] **Step 2: Add keys to `pt.properties`**

Append at the end of the file:

```properties
nav.product=Produto
nav.solutions=Solu\u00E7\u00F5es
nav.pricing=Pre\u00E7os
nav.docs=Docs
nav.logIn=Entrar
nav.startFreeTrial=Come\u00E7ar gr\u00E1tis
homepage.hero.badge=v2.0 Beta Live
homepage.hero.headline=Domine sua pr\u00F3xima certifica\u00E7\u00E3o com precis\u00E3o baseada em IA.
homepage.hero.description=Gere quest\u00F5es de pr\u00E1tica de alta fidelidade para AWS, SAP e GCP. Adaptadas \u00E0s suas lacunas de conhecimento, pensadas para o arquiteto moderno.
homepage.cta.startFreeTrial=Come\u00E7ar gratuitamente
homepage.cta.viewSampleQuestions=Ver quest\u00F5es de exemplo
homepage.trustedBy=Utilizado por engenheiros em
footer.brand=MyQuiz
footer.privacy=Pol\u00EDtica de Privacidade
footer.terms=Termos de Servi\u00E7o
footer.security=Seguran\u00E7a
footer.status=Status
footer.copyright=\u00A9 2025 MyQuiz AI. Precision-engineered for technical mastery.
```

- [ ] **Step 3: Commit**

```bash
git add public/messages/en.properties public/messages/pt.properties
git commit -m "feat: add i18n keys for landing page redesign"
```

---

## Task 2: Rewrite Footer

**Files:**
- Modify: `sharedComponents/ui/footer.tsx`

- [ ] **Step 1: Replace entire file content**

```tsx
'use client';

import NextLink from 'next/link';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-divider bg-background py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="font-bold uppercase tracking-widest text-sm text-foreground">
          {t('footer.brand')}
        </span>
        <div className="flex flex-wrap justify-center gap-6">
          <NextLink href="#" className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200">
            {t('footer.privacy')}
          </NextLink>
          <NextLink href="#" className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200">
            {t('footer.terms')}
          </NextLink>
          <NextLink href="#" className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200">
            {t('footer.security')}
          </NextLink>
          <NextLink href="#" className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200">
            {t('footer.status')}
          </NextLink>
        </div>
        <span className="text-xs text-default-400">{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add sharedComponents/ui/footer.tsx
git commit -m "feat: rewrite footer with Stitch layout"
```

---

## Task 3: Rewrite Navbar

**Files:**
- Modify: `sharedComponents/ui/navbar.tsx`

Key changes from current version:
- Logo: `faBrain` icon + "MyQuiz" text (was an "AI" div badge + "AIQuiz")
- Desktop nav: Product dropdown (HeroUI Dropdown) + Solutions/Pricing/Docs static links (was `siteConfig.navItems` loop)
- Unauthenticated right side: "Log In" text link + "Start Free Trial" button (was single "Sign In" button)
- Mobile menu: Product section label + product items + static links (was `siteConfig.navMenuItems` loop)
- Removed: search input (not in Stitch design)
- Kept intact: user dropdown (Avatar + settings), UsageBadge, UpgradeModal, authentication state logic

- [ ] **Step 1: Replace entire file content**

```tsx
'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from '@heroui/navbar';
import { Link } from '@heroui/link';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faBrain, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { UpgradeModal } from '@/sharedComponents/ui/UpgradeModal';
import { UsageBadge } from '@/sharedComponents/ui/UsageBadge';
import { getBillingUsage } from '@/features/connectors';
import type { UsageStats } from '@/types';
import { ThemeSwitch } from '@/sharedComponents/ui/theme-switch';
import { LanguageSwitch } from '@/sharedComponents/ui/language-switch';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

const PRODUCT_ITEMS = [
  { label: 'nav.quiz', href: '/quiz' },
  { label: 'nav.generateQuestions', href: '/generate-questions' },
  { label: 'nav.configureCertification', href: '/configure-certification' },
] as const;

const NAV_LINKS = [
  { label: 'nav.solutions', href: '#' },
  { label: 'nav.pricing', href: '#' },
  { label: 'nav.docs', href: '#' },
] as const;

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      getBillingUsage().then(setUsage).catch(() => {});
    } else {
      setUsage(null);
    }
  }, [status]);

  const userDropdown = (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          as="button"
          size="sm"
          src={session?.user?.image ?? undefined}
          name={session?.user?.name ?? session?.user?.email ?? undefined}
          classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent cursor-pointer' }}
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t('aria.userMenu')}
        closeOnSelect={false}
        className="min-w-[200px]"
      >
        <DropdownSection showDivider>
          <DropdownItem key="user-info" isReadOnly className="opacity-100 cursor-default">
            <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
            <p className="text-xs text-default-400">{session?.user?.email}</p>
          </DropdownItem>
        </DropdownSection>
        {usage?.plan === 'free' ? (
          <DropdownSection showDivider>
            <DropdownItem
              key="upgrade"
              className="text-primary font-semibold"
              startContent={<FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />}
              onPress={() => setIsUpgradeOpen(true)}
            >
              {t('billing.upgradeButton')}
            </DropdownItem>
          </DropdownSection>
        ) : null}
        <DropdownSection showDivider>
          <DropdownItem key="theme" isReadOnly className="cursor-default">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-default-600">{t('nav.theme')}</span>
              <ThemeSwitch />
            </div>
          </DropdownItem>
          <DropdownItem key="language" isReadOnly className="cursor-default">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-default-600">{t('nav.language')}</span>
              <LanguageSwitch />
            </div>
          </DropdownItem>
        </DropdownSection>
        <DropdownItem
          key="sign-out"
          color="danger"
          className="text-danger"
          onPress={() => signOut({ callbackUrl: '/login' })}
        >
          {t('common.signOut')}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  return (
    <>
      <HeroUINavbar
        maxWidth="xl"
        position="sticky"
        classNames={{
          base: 'bg-background border-b border-divider',
          wrapper: 'px-4 sm:px-6',
        }}
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink className="flex justify-start items-center gap-2.5" href="/">
              <FontAwesomeIcon icon={faBrain} className="text-primary text-lg" />
              <p className="font-bold text-foreground tracking-wide text-sm">MyQuiz</p>
            </NextLink>
          </NavbarBrand>

          <ul className="hidden lg:flex gap-1 justify-start ml-2 items-center">
            <NavbarItem>
              <Dropdown>
                <DropdownTrigger>
                  <button className="flex items-center gap-1.5 text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200">
                    {t('nav.product')}
                    <FontAwesomeIcon icon={faChevronDown} className="w-2.5 h-2.5" />
                  </button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t('nav.product')}>
                  {PRODUCT_ITEMS.map((item) => (
                    <DropdownItem key={item.href} as={NextLink} href={item.href}>
                      {t(item.label)}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
            {NAV_LINKS.map((item) => (
              <NavbarItem key={item.label}>
                <NextLink
                  href={item.href}
                  className="text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200"
                >
                  {t(item.label)}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
          {status === 'authenticated' && usage && (
            <NavbarItem>
              <UsageBadge usage={usage} />
            </NavbarItem>
          )}
          <NavbarItem className="hidden sm:flex gap-2 items-center">
            {status === 'authenticated' && session?.user ? (
              userDropdown
            ) : (
              <div className="flex items-center gap-3">
                <NextLink
                  href="/login"
                  className="text-sm text-default-500 hover:text-foreground transition-colors duration-200"
                >
                  {t('nav.logIn')}
                </NextLink>
                <Button
                  as={NextLink}
                  href="/login"
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold rounded-lg transition-colors duration-200 px-4"
                >
                  {t('nav.startFreeTrial')}
                </Button>
              </div>
            )}
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          {status === 'authenticated' && session?.user ? (
            userDropdown
          ) : (
            <Button
              as={NextLink}
              href="/login"
              size="sm"
              className="bg-primary text-primary-foreground font-semibold rounded-lg"
            >
              {t('nav.logIn')}
            </Button>
          )}
          <NavbarMenuToggle className="text-default-500" />
        </NavbarContent>

        <NavbarMenu className="bg-background border-t border-divider pt-4">
          <div className="mx-4 mt-2 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-widest text-default-400 font-semibold px-2 pt-2 pb-1">
              {t('nav.product')}
            </p>
            {PRODUCT_ITEMS.map((item) => (
              <NavbarMenuItem key={item.href}>
                <Link href={item.href} size="lg" className="text-default-500 hover:text-foreground pl-2">
                  {t(item.label)}
                </Link>
              </NavbarMenuItem>
            ))}
            {NAV_LINKS.map((item) => (
              <NavbarMenuItem key={item.label}>
                <Link href={item.href} size="lg" className="text-default-500 hover:text-foreground">
                  {t(item.label)}
                </Link>
              </NavbarMenuItem>
            ))}
          </div>
        </NavbarMenu>
      </HeroUINavbar>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add sharedComponents/ui/navbar.tsx
git commit -m "feat: rewrite navbar with Product dropdown and Stitch layout"
```

---

## Task 4: Rewrite Landing Page

**Files:**
- Modify: `app/page.tsx`

Sections: `HeroSection` (2-col layout) + `TrustedBySection` (companies strip) + `FeaturesSection` (bento grid). The `AppMockup` component is defined inline in the same file (used only by `HeroSection`).

Removed from current page: `StatsSection`, `CertificationsSection`, `TestimonialsSection`, `CompaniesSection`, `CtaSection` and their data arrays (`STATS`, `CERTIFICATIONS`, `TESTIMONIALS`).

Kept: `FEATURES` array (new icon property), `COMPANIES` array.

- [ ] **Step 1: Replace entire file content**

```tsx
'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faFileLines, faRoute } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

/* ── Data ───────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: faRobot,
    heading: 'homepage.features.ai.heading',
    body: 'homepage.features.ai.body',
  },
  {
    icon: faFileLines,
    heading: 'homepage.features.answers.heading',
    body: 'homepage.features.answers.body',
  },
  {
    icon: faRoute,
    heading: 'homepage.features.topics.heading',
    body: 'homepage.features.topics.body',
  },
] as const;

const COMPANIES = [
  { name: 'Accenture', color: '#A100FF' },
  { name: 'Deloitte', color: '#86BC25' },
  { name: 'Capgemini', color: '#0070AD' },
  { name: 'IBM', color: '#1F70C1' },
  { name: 'NTT Data', color: '#003087' },
  { name: 'Wipro', color: '#341C54' },
  { name: 'Cognizant', color: '#0033A0' },
  { name: 'Infosys', color: '#007CC5' },
] as const;

/* ── Page ───────────────────────────────────────────────── */

export default function HeroPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────── */

function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="w-full md:w-5/12 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-content1 border border-divider w-fit">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs uppercase tracking-widest text-default-500 font-medium">
              {t('homepage.hero.badge')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            {t('homepage.hero.headline')}
          </h1>
          <p className="text-base text-default-500 leading-relaxed">
            {t('homepage.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              as={NextLink}
              href="/quiz"
              size="lg"
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              {t('homepage.cta.startFreeTrial')}
            </Button>
            <Button
              as={NextLink}
              href="/generate-questions"
              variant="bordered"
              size="lg"
              className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 rounded-lg"
            >
              {t('homepage.cta.viewSampleQuestions')}
            </Button>
          </div>
        </div>

        <div className="w-full md:w-7/12">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}

/* ── App Mockup ─────────────────────────────────────────── */

function AppMockup() {
  return (
    <div className="relative bg-content1 border border-divider rounded-xl overflow-hidden aspect-[4/3] shadow-lg">
      <div className="absolute top-0 left-0 w-full h-8 bg-content2 border-b border-divider flex items-center px-4 gap-2 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
      </div>
      <div className="absolute inset-0 pt-8 p-5 flex flex-col gap-2 font-mono text-xs select-none overflow-hidden">
        <div>
          <span className="text-indigo-400">const</span>{' '}
          <span className="text-cyan-300">question</span>{' '}
          <span className="text-default-400">=</span>{' '}
          <span className="text-amber-300">await</span>{' '}
          <span className="text-cyan-300">generateQuestion</span>
          <span className="text-default-500">{'({'}</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">certification</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;AWS-SAA-C03&quot;</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">domain</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;Security&quot;</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">difficulty</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;advanced&quot;</span>
        </div>
        <div><span className="text-default-500">{'}'});</span></div>
        <div className="mt-2">
          <span className="text-indigo-400">const</span>{' '}
          <span className="text-cyan-300">score</span>{' '}
          <span className="text-default-400">=</span>{' '}
          <span className="text-default-400">{'{'}</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">correct</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">47</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">total</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">50</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">confidence</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">0.942</span>
        </div>
        <div><span className="text-default-500">{'}'}</span></div>
      </div>
      <div className="absolute bottom-4 right-4 bg-content2 border border-divider rounded-lg p-3 flex flex-col gap-0.5">
        <span className="text-xs text-primary font-medium">Analysis Complete</span>
        <span className="text-xs font-mono text-foreground">Confidence: 94.2%</span>
      </div>
    </div>
  );
}

/* ── Trusted By ─────────────────────────────────────────── */

function TrustedBySection() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-divider bg-content1/50 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-widest text-default-400 font-semibold">
          {t('homepage.trustedBy')}
        </span>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {COMPANIES.map((company) => (
            <span
              key={company.name}
              className="text-lg font-black tracking-tight opacity-40 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-200 cursor-default"
              style={{ color: company.color }}
            >
              {company.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────── */

function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.heading}
            className="bg-content1 border border-divider rounded-xl p-6 flex flex-col gap-4 hover:border-default-300 transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FontAwesomeIcon icon={feature.icon} className="text-primary text-sm" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t(feature.heading)}</h3>
            <p className="text-sm text-default-500 leading-relaxed">{t(feature.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- Hero is 2-column on desktop, stacked on mobile
- App mockup shows code lines + floating badge
- "Trusted by engineers at" strip with company names
- 3 feature cards in a grid
- Navbar has Product dropdown with app links
- Footer has 3-column layout with links

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rewrite landing page with Stitch design (Hero 2-col, Trusted By, Features)"
```
