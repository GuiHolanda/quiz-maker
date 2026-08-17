'use client';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { MktCtaLink } from '@/app/(marketing)/components/shared/MktCtaLink';

interface ExamFinalCtaSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFinalCtaSection({ config }: ExamFinalCtaSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-mkt-surface border-t border-mkt-divider py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-8">
        <h2 className="ds-heading text-mkt-text text-4xl lg:text-5xl leading-tight">
          {t('landing.cta.heading', { name: config.name })}
        </h2>

        <p className="text-mkt-text opacity-60 text-base sm:text-lg">{t('landing.cta.subheading')}</p>

        <div className="flex flex-col items-center gap-3">
          <MktCtaLink href="/register" icon={faArrowRight} size="lg">
            {t('landing.cta.primary')}
          </MktCtaLink>
          <p className="text-mkt-text opacity-50 text-xs">{t('landing.cta.secondary')}</p>
        </div>
      </div>
    </section>
  );
}
