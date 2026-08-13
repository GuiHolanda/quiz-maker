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
    <section className="bg-content2 border-y border-divider py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
        <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
          {STATS.map((stat, index) => (
            <div key={stat} className="relative flex flex-col items-center gap-1 text-center">
              {index > 0 && (
                <span className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-divider" />
              )}
              <span className="font-sora font-extrabold text-3xl sm:text-4xl text-foreground">
                {t(`landing.social.${stat}.value`)}
              </span>
              <span className="text-default-500 text-xs sm:text-sm">
                {t(`landing.social.${stat}.label`)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-8">
          <h3 className="font-sora font-bold text-foreground text-lg sm:text-xl text-center">
            {t('landing.social.testimonials.heading')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial}
                className="bg-content1 border border-divider rounded-xl p-5 flex flex-col gap-4"
              >
                <p className="text-default-500 text-sm leading-relaxed">
                  {t('landing.social.placeholder.body')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-content2 rounded-full border border-divider shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs font-semibold">
                      {t('landing.social.placeholder.name')}
                    </span>
                    <span className="font-mono text-xs text-default-400">{config.name}</span>
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
