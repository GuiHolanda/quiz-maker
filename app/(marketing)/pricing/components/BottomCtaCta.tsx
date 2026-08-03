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
        className="font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded tracking-wide transition-colors duration-200"
        href="/register"
        size="lg"
      >
        {t('pricing.cta2.button')}
      </Button>
      <Button
        as={NextLink}
        className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded tracking-wide"
        href={session?.user ? '/simulados' : '/register'}
        size="lg"
        variant="bordered"
      >
        {t('homepage.cta.startPracticing')}
      </Button>
    </div>
  );
}
