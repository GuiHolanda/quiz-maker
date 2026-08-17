'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { MktCtaLink } from '@/app/(marketing)/components/shared/MktCtaLink';
import { usePrimaryCtaHref } from '@/app/(marketing)/components/shared/usePrimaryCtaHref';

export function CtaSectionCta() {
  const { t } = useTranslation();
  const primaryHref = usePrimaryCtaHref();

  return (
    <>
      <h2 className="ds-heading text-mkt-text text-3xl mb-5">{t('homepage.cta2.title')}</h2>
      <p className="text-mkt-text opacity-60 text-base mb-8 max-w-lg mx-auto">{t('homepage.cta2.body')}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="blueprint relative">
          <BlueprintCorners />
          <MktCtaLink href={primaryHref}>{t('homepage.cta2.primaryCta')}</MktCtaLink>
        </div>
        <MktCtaLink href="/pricing" variant="secondary">
          {t('homepage.cta2.secondaryCta')}
        </MktCtaLink>
      </div>
      <p className="kick mt-6 text-center opacity-50">{t('homepage.cta2.tagline')}</p>
    </>
  );
}
