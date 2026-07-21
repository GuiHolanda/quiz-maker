'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const PLATFORM_LINKS = [
  { labelKey: 'footer.awsExams', href: '/simulados' },
  { labelKey: 'footer.azureExams', href: '/simulados' },
  { labelKey: 'footer.sapExams', href: '/simulados' },
  { labelKey: 'footer.concursosLink', href: '/simulados' },
  { labelKey: 'nav.pricing', href: '/pricing' },
] as const;

// Not yet live — rendered as disabled text, not clickable anchors
const COMPANY_LINKS = [
  { labelKey: 'footer.about' },
  { labelKey: 'footer.blog' },
  { labelKey: 'footer.careers' },
  { labelKey: 'footer.status' },
] as const;

const LEGAL_LINKS = [
  { labelKey: 'footer.privacy' },
  { labelKey: 'footer.terms' },
  { labelKey: 'footer.lgpd' },
  { labelKey: 'footer.security' },
] as const;

export function MarketingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-navy-950 border-t border-navy-800/40 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-accent/10 border border-accent/30">
                <FontAwesomeIcon className="text-accent text-xs" icon={faMicrochip} />
              </div>
              <span className="font-sora font-bold text-white text-sm">{t('footer.brand')}</span>
            </div>
            <p className="text-xs text-navy-500 leading-relaxed mb-4 max-w-52">{t('footer.description')}</p>
          </div>

          {/* Platform column */}
          <div>
            <p className="text-xs font-medium text-navy-400 mb-4">{t('footer.platform')}</p>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <NextLink
                    className="text-xs text-navy-400 hover:text-white transition-colors duration-200"
                    href={item.href}
                  >
                    {t(item.labelKey)}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column — not yet live */}
          <div>
            <p className="text-xs font-medium text-navy-400 mb-4">{t('footer.company')}</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <span
                    className="text-xs text-navy-700 cursor-default select-none"
                    title={t('footer.comingSoon')}
                    aria-disabled="true"
                  >
                    {t(item.labelKey)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column — not yet live */}
          <div>
            <p className="text-xs font-medium text-navy-400 mb-4">{t('footer.legal')}</p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((item) => (
                <li key={item.labelKey}>
                  <span
                    className="text-xs text-navy-700 cursor-default select-none"
                    title={t('footer.comingSoon')}
                    aria-disabled="true"
                  >
                    {t(item.labelKey)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-navy-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-navy-600">{t('footer.copyright')}</p>
          <p className="text-xs text-navy-600">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
