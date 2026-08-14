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
        className="font-semibold text-sm bg-mkt-accent text-white hover:opacity-90 transition-opacity duration-200"
        href="/register"
        radius="none"
        size="lg"
      >
        {t('pricing.cta2.button')}
      </Button>
      <Button
        as={NextLink}
        className="font-medium text-sm text-mkt-text bg-transparent border border-mkt-divider hover:border-mkt-accent"
        href={session?.user ? '/simulados' : '/register'}
        radius="none"
        size="lg"
        variant="bordered"
      >
        {t('homepage.cta.startPracticing')}
      </Button>
    </div>
  );
}
