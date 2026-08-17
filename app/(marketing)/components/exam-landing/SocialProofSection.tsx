'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

const STATS = ['stat1', 'stat2', 'stat3'] as const;
const TESTIMONIALS = ['t1', 't2', 't3'] as const;

interface SocialProofSectionProps {
  readonly config: ExamLandingConfig;
}

export function SocialProofSection({ config }: SocialProofSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-mkt-surface border-t border-mkt-divider py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
        <div className="grid grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider max-w-2xl mx-auto w-full">
          {STATS.map((stat) => (
            <div key={stat} className="bg-mkt-surface px-4 py-7 flex flex-col items-center gap-1 text-center">
              <span className="mono text-3xl sm:text-4xl text-mkt-text">{t(`landing.social.${stat}.value`)}</span>
              <span className="kick">{t(`landing.social.${stat}.label`)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8">
          <h3 className="ds-heading text-mkt-text text-2xl text-center">{t('landing.social.testimonials.heading')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial} className="bg-mkt-bg p-6 flex flex-col gap-4">
                <p className="text-mkt-text opacity-60 text-sm leading-relaxed">
                  {t('landing.social.placeholder.body')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-mkt-surface border border-mkt-divider shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-mkt-text text-xs font-semibold">{t('landing.social.placeholder.name')}</span>
                    <span className="mono text-[11px] text-mkt-text opacity-50">{config.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
