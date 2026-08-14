'use client';

import NextLink from 'next/link';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

export function CtaSectionCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <>
      <h2 className="ds-heading text-mkt-text text-3xl mb-5">{t('homepage.cta2.title')}</h2>
      <p className="text-mkt-text opacity-60 text-base mb-8 max-w-lg mx-auto">{t('homepage.cta2.body')}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="blueprint relative">
          <BlueprintCorners />
          <NextLink
            className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-6 py-3 hover:opacity-90 transition-opacity"
            href={session?.user ? '/simulados' : '/register'}
          >
            {t('homepage.cta2.primaryCta')}
          </NextLink>
        </div>
        <NextLink
          className="inline-flex items-center text-sm font-medium border border-mkt-divider text-mkt-text opacity-70 hover:opacity-100 px-6 py-3 transition-opacity"
          href="/pricing"
        >
          {t('homepage.cta2.secondaryCta')}
        </NextLink>
      </div>
      <p className="kick mt-6 text-center opacity-50">{t('homepage.cta2.tagline')}</p>
    </>
  );
}
