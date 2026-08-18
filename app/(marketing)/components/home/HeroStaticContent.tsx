'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { HeroCta } from '@/app/(marketing)/components/home/HeroCta';
import { PLAN_LIMITS } from '@/config/constants';

export function HeroStaticContent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="ds-heading text-mkt-text text-4xl xl:text-5xl leading-tight mb-6 text-balance">
        {t('homepage.hero.line1')}
        <br />
        {t('homepage.hero.line2')}
      </h1>
      <p className="text-mkt-text opacity-60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg text-pretty">
        {t('homepage.hero.description')}
      </p>
      <HeroCta />
      {/* The old avatar row and headcount were invented. Until there are real
          numbers, the space works harder as a restatement of the free offer. */}
      <p className="mono text-xs text-mkt-text opacity-50">
        {t('homepage.hero.disclaimer', { free: PLAN_LIMITS.free.questionsPerPeriod })}
      </p>
    </div>
  );
}
