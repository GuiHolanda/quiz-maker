'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { usePrimaryCtaHref } from '@/app/(marketing)/components/shared/usePrimaryCtaHref';
import { DEMO_QUIZ_SIZE, PLAN_LIMITS } from '@/config/constants';

import { useDemoCta } from './useDemoCta.hook';

interface ExamFinalCtaSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFinalCtaSection({ config }: ExamFinalCtaSectionProps) {
  const { t } = useTranslation();
  const demoCta = useDemoCta(config);
  // The closing block is the only place that names what comes after the demo,
  // so its second slot is the account, never a link back up the page.
  const accountHref = usePrimaryCtaHref();

  return (
    <section className="scroll-mt-24 bg-mkt-surface border-t border-mkt-divider py-20 text-center" id="comecar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="ds-heading text-mkt-text text-4xl sm:text-5xl leading-tight max-w-2xl mx-auto text-balance">
          {t('landing.cta.heading', { count: DEMO_QUIZ_SIZE, name: config.name })}
        </h2>

        <p className="text-mkt-text opacity-70 text-base sm:text-[16.5px] leading-relaxed max-w-xl mx-auto mt-4 text-pretty">
          {t('landing.cta.subheading', { free: PLAN_LIMITS.free.questionsPerPeriod })}
        </p>

        <div className="flex flex-wrap gap-2.5 justify-center mt-7">
          <NextLink
            className="relative inline-flex items-center justify-center text-[15px] font-semibold bg-mkt-accent text-white px-7 py-3.5 hover:opacity-90 transition-opacity"
            href={demoCta.href}
          >
            <BlueprintCorners />
            {demoCta.label}
          </NextLink>

          <NextLink
            className="inline-flex items-center justify-center text-[15px] border border-mkt-divider text-mkt-text px-6 py-3.5 hover:bg-mkt-bg transition-colors"
            href={accountHref}
          >
            {t('landing.cta.secondary')}
          </NextLink>
        </div>
      </div>
    </section>
  );
}
