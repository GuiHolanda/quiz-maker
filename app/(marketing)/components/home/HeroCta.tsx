'use client';

import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { MktCtaLink } from '@/app/(marketing)/components/shared/MktCtaLink';
import { usePrimaryCtaHref } from '@/app/(marketing)/components/shared/usePrimaryCtaHref';
import { DEMO_PATH } from '@/config/demo-links';

export function HeroCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const primaryHref = usePrimaryCtaHref();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-10">
      <MktCtaLink href={primaryHref}>{t('homepage.cta.startFreeTrial')}</MktCtaLink>
      {/* Anonymous visitors get the interactive demo — the label promises sample
          questions, and the demo is where real ones are actually shown. */}
      <MktCtaLink href={session?.user ? '/questions' : DEMO_PATH} variant="secondary">
        {t('homepage.cta.viewSampleQuestions')}
      </MktCtaLink>
    </div>
  );
}
