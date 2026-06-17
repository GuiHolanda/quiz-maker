'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-divider bg-background2 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="font-bold text-sm text-foreground">{t('footer.brand')}</span>
        <div className="flex flex-wrap justify-center gap-6">
          <NextLink className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200" href="#">
            {t('footer.privacy')}
          </NextLink>
          <NextLink className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200" href="#">
            {t('footer.terms')}
          </NextLink>
          <NextLink className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200" href="#">
            {t('footer.security')}
          </NextLink>
          <NextLink className="text-xs text-default-400 hover:text-default-600 transition-colors duration-200" href="#">
            {t('footer.status')}
          </NextLink>
        </div>
        <span className="text-xs text-default-400">{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
