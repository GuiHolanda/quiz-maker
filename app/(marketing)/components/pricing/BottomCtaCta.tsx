'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { usePrimaryCtaHref } from '@/app/(marketing)/components/shared/usePrimaryCtaHref';

export function BottomCtaCta() {
  const { t } = useTranslation();
  const primaryHref = usePrimaryCtaHref();

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
        href={primaryHref}
        radius="none"
        size="lg"
        variant="bordered"
      >
        {t('homepage.cta.startPracticing')}
      </Button>
    </div>
  );
}
