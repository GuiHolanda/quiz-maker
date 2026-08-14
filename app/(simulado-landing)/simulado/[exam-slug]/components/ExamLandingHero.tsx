'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { TerminalDemo } from '@/app/(marketing)/components/TerminalDemo';

interface ExamLandingHeroProps {
  readonly config: ExamLandingConfig;
}

export function ExamLandingHero({ config }: ExamLandingHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-background pt-16 pb-20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-start">
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight">
              {config.heroHeadline.split(config.name).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-primary">{config.name}</span>}
                </span>
              ))}
            </h1>

            <p className="text-default-400 font-semibold text-base sm:text-lg leading-relaxed max-w-lg">
              {config.heroSubheadline}
            </p>

            <div className="flex flex-col items-start gap-2 pt-2">
              <a
                href="#demo-simulado"
                className="inline-flex items-center gap-2 bg-primary text-background font-bold text-base px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                {t('landing.hero.ctaPrimary')}
                <FontAwesomeIcon className="text-xs" icon={faArrowRight} />
              </a>
              <p className="text-default-400 text-xs">{t('landing.hero.ctaDisclaimer')}</p>
            </div>
          </div>
          <TerminalDemo />
        </div>
      </div>
    </section>
  );
}
