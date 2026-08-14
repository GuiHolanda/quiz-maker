'use client';

import { useState } from 'react';
import NextLink from 'next/link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const navLinkClass = 'text-sm font-medium text-mkt-text opacity-60 hover:opacity-100 transition-opacity duration-150';

const SECTION_LINKS = [
  { labelKey: 'landing.nav.howItWorks', href: '#how-it-works' },
  { labelKey: 'landing.nav.demo', href: '#demo-simulado' },
  { labelKey: 'landing.nav.faq', href: '#faq' },
] as const;

export function FocusedCtaNavbar() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="border-b border-mkt-divider bg-mkt-bg overflow-hidden">
        <div className="px-8 sm:px-16">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-16">
              <NextLink className="flex items-center" href="/">
                <span className="ds-heading text-mkt-text text-xl tracking-tight">Certifique AI</span>
              </NextLink>

              <nav aria-label="Page sections" className="hidden md:flex items-center gap-7">
                {SECTION_LINKS.map((item) => (
                  <a key={item.labelKey} className={navLinkClass} href={item.href}>
                    {t(item.labelKey)}
                  </a>
                ))}
                <NextLink className={navLinkClass} href="/pricing">
                  {t('nav.pricing')}
                </NextLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <NextLink className={`${navLinkClass} hidden sm:block`} href="/login">
                {t('nav.logIn')}
              </NextLink>
              <NextLink
                className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-4 py-2 leading-none hover:opacity-90 transition-opacity"
                href="/register"
              >
                {t('nav.startFreeTrial')}
              </NextLink>
              <button
                type="button"
                aria-label={isMenuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
                aria-expanded={isMenuOpen}
                className="md:hidden text-mkt-text opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} className="text-sm" />
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-mkt-divider bg-mkt-bg px-4 py-3">
            <nav aria-label="Mobile navigation" className="flex flex-col">
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.labelKey}
                  className="text-sm text-mkt-text opacity-60 hover:opacity-100 transition-opacity py-3 border-b border-mkt-divider last:border-0"
                  href={item.href}
                  onClick={closeMenu}
                >
                  {t(item.labelKey)}
                </a>
              ))}
              <NextLink
                className="text-sm text-mkt-text opacity-60 hover:opacity-100 transition-opacity py-3 border-b border-mkt-divider"
                href="/pricing"
                onClick={closeMenu}
              >
                {t('nav.pricing')}
              </NextLink>
              <NextLink
                className="text-sm text-mkt-text opacity-60 hover:opacity-100 transition-opacity py-3 sm:hidden"
                href="/login"
                onClick={closeMenu}
              >
                {t('nav.logIn')}
              </NextLink>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
