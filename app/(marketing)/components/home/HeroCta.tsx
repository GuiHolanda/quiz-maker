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
      {/* Label follows the destination: anonymous visitors land in the interactive demo,
          signed-in ones go to their own library. A single shared label used to describe
          neither — "sample questions" set up a static list and the demo is a 3-step flow. */}
      {session?.user ? (
        <MktCtaLink href="/questions" variant="secondary">
          {t('homepage.cta.myQuestions')}
        </MktCtaLink>
      ) : (
        <MktCtaLink href={DEMO_PATH} variant="secondary">
          {t('homepage.cta.seeDemo')}
        </MktCtaLink>
      )}
    </div>
  );
}
