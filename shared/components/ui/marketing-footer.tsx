'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { DEMO_PATH } from '@/config/demo-links';
import { EXAM_LANDING_PAGES } from '@/config/exam-landing-pages';

const PLATFORM_LINKS = [
  { labelKey: 'nav.demo', href: DEMO_PATH },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'register.createAccount', href: '/register' },
  { labelKey: 'common.signIn', href: '/login' },
] as const;

const LEGAL_LINKS = [
  { labelKey: 'footer.privacy', href: '/privacy' },
  { labelKey: 'footer.terms', href: '/terms' },
  { labelKey: 'footer.lgpd', href: '/lgpd' },
  { labelKey: 'footer.security', href: '/security' },
] as const;

const SIMULADO_LINKS = EXAM_LANDING_PAGES.map((exam) => ({
  key: exam.slug,
  label: exam.name,
  href: `/simulado/${exam.slug}`,
}));

export function MarketingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-mkt-bg border-t border-mkt-divider py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <span className="ds-heading text-mkt-text text-sm block mb-4">{t('footer.brand')}</span>
            <p className="text-sm text-mkt-text opacity-50 leading-relaxed max-w-xs">{t('footer.description')}</p>
          </div>

          <div>
            <p className="kick mb-4">{t('footer.platform')}</p>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <NextLink
                    className="text-sm text-mkt-text opacity-50 hover:opacity-100 transition-opacity duration-200"
                    href={item.href}
                  >
                    {t(item.labelKey)}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kick mb-4">{t('nav.freeSimulados')}</p>
            <ul className="space-y-3">
              {SIMULADO_LINKS.map((item) => (
                <li key={item.key}>
                  <NextLink
                    className="text-sm text-mkt-text opacity-50 hover:opacity-100 transition-opacity duration-200"
                    href={item.href}
                  >
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kick mb-4">{t('footer.legal')}</p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <NextLink
                    className="text-sm text-mkt-text opacity-50 hover:opacity-100 transition-opacity duration-200"
                    href={item.href}
                  >
                    {t(item.labelKey)}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-mkt-divider flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-mkt-text opacity-35">{t('footer.copyright')}</p>
          <p className="text-xs text-mkt-text opacity-35">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
