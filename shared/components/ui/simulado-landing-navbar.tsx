'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const navLinkClass = 'text-sm font-semibold text-default-500 hover:text-foreground transition-colors duration-150';
const LAST_EXAM_KEY = 'certiq_last_exam';
const DEFAULT_EXAM_PATH = '/simulado/cea';

export function SimuladoLandingNavbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastExamPath, setLastExamPath] = useState('');

  const closeMenu = () => setIsMenuOpen(false);
  const isOnPricing = pathname === '/pricing';

  useEffect(() => {
    if (pathname.startsWith('/simulado/')) {
      sessionStorage.setItem(LAST_EXAM_KEY, pathname);
      setLastExamPath(pathname);
    } else {
      setLastExamPath(sessionStorage.getItem(LAST_EXAM_KEY) ?? '');
    }
  }, [pathname]);

  function sectionHref(hash: string): string {
    if (!isOnPricing) return hash;
    return (lastExamPath || DEFAULT_EXAM_PATH) + hash;
  }

  return (
    <div data-theme="dark" className="fixed z-50 w-full mx-auto">
      <header className=" border-content1 bg-background overflow-hidden border-b">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex gap-32">
              <NextLink className="flex items-center gap-2.5" href="/">
                <span className="font-sora font-bold text-white text-base">Certifique AI</span>
              </NextLink>
              <nav aria-label="Page sections" className="hidden md:flex items-center gap-7">
                <a className={navLinkClass} href={sectionHref('#how-it-works')}>
                  {t('landing.nav.howItWorks')}
                </a>
                <a className={navLinkClass} href={sectionHref('#demo-simulado')}>
                  {t('landing.nav.demo')}
                </a>
                <a className={navLinkClass} href={sectionHref('#faq')}>
                  {t('landing.nav.faq')}
                </a>
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
                href="/register"
                className="inline-flex items-center font-sans text-xs font-semibold bg-primary text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('nav.startFreeTrial')}
              </NextLink>
              <button
                aria-label={isMenuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
                aria-expanded={isMenuOpen}
                className="md:hidden flex items-center justify-center w-9 h-9 text-default-400 hover:text-foreground transition-colors duration-150"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-white/10 px-4 pb-4 pt-2 flex flex-col"
          >
            <a className={`${navLinkClass} py-3`} href={sectionHref('#how-it-works')} onClick={closeMenu}>
              {t('landing.nav.howItWorks')}
            </a>
            <a className={`${navLinkClass} py-3`} href={sectionHref('#demo-simulado')} onClick={closeMenu}>
              {t('landing.nav.demo')}
            </a>
            <a className={`${navLinkClass} py-3`} href={sectionHref('#faq')} onClick={closeMenu}>
              {t('landing.nav.faq')}
            </a>
            <NextLink className={`${navLinkClass} py-3`} href="/pricing" onClick={closeMenu}>
              {t('nav.pricing')}
            </NextLink>
            <NextLink className={`${navLinkClass} py-3 sm:hidden`} href="/login" onClick={closeMenu}>
              {t('nav.logIn')}
            </NextLink>
          </nav>
        )}
      </header>
    </div>
  );
}
