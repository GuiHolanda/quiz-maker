'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function BottomCtaCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button
        as={NextLink}
        className="font-semibold text-sm bg-primary hover:opacity-90 text-[#0f172a] rounded tracking-wide transition-opacity duration-200"
        href="/register"
        size="lg"
      >
        {t('pricing.cta2.button')}
      </Button>
      <Button
        as={NextLink}
        className="font-medium text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded tracking-wide"
        href={session?.user ? '/simulados' : '/register'}
        size="lg"
        variant="bordered"
      >
        {t('homepage.cta.startPracticing')}
      </Button>
    </div>
  );
}
