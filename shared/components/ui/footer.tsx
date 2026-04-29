'use client';

import NextLink from 'next/link';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-divider bg-background2 py-10 px-6">
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
