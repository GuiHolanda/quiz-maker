'use client';

import NextLink from 'next/link';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function HeroCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-10">
      <NextLink
        className="inline-flex items-center justify-center text-sm font-semibold bg-[var(--color-accent)] text-white px-6 py-3 hover:opacity-90 transition-opacity"
        href={session?.user ? '/simulados' : '/register'}
      >
        {t('homepage.cta.startFreeTrial')}
      </NextLink>
      <NextLink
        className="inline-flex items-center justify-center text-sm font-medium text-[var(--color-text)] opacity-70 hover:opacity-100 border border-[var(--color-divider)] px-6 py-3 transition-opacity"
        href={session?.user ? '/questions' : '/pricing'}
      >
        {t('homepage.cta.viewSampleQuestions')}
      </NextLink>
    </div>
  );
}
