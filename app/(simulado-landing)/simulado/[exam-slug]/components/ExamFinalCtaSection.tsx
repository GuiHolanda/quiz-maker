'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

interface ExamFinalCtaSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFinalCtaSection({ config }: ExamFinalCtaSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-background border-t border-divider py-20 sm:py-28 relative overflow-hidden">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-8">
        <h2 className="font-playfair font-extrabold text-foreground text-3xl sm:text-4xl lg:text-5xl leading-tight">
          {t('landing.cta.heading', { name: config.name })}
        </h2>

        <p className="text-default-500 text-base sm:text-lg">{t('landing.cta.subheading')}</p>

        <div className="flex flex-col items-center gap-3">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-base px-10 py-4 rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('landing.cta.primary')}
            <FontAwesomeIcon className="text-xs" icon={faArrowRight} />
          </a>
          <p className="text-default-400 text-xs">{t('landing.cta.secondary')}</p>
        </div>
      </div>
    </section>
  );
}
