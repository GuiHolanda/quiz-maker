'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface ExamLandingHeroProps {
  readonly config: ExamLandingConfig;
}

export function ExamLandingHero({ config }: ExamLandingHeroProps) {
  const { t } = useTranslation();
  const headlineParts = config.heroHeadline.split(config.name);
  const previewTopics = config.topics.slice(0, 4);

  return (
    <section className="bg-mkt-bg py-20 border-b border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-16 items-start">
          <div className="flex flex-col gap-6">
            <span className="kick">{config.provider}</span>
            <h1 className="ds-heading text-mkt-text text-4xl xl:text-5xl leading-tight">
              {headlineParts.map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-mkt-accent">{config.name}</span>}
                </span>
              ))}
            </h1>

            <p className="text-mkt-text opacity-60 text-base sm:text-lg leading-relaxed max-w-lg">
              {config.heroSubheadline}
            </p>

            <div className="flex flex-col items-start gap-2 pt-2">
              <a
                href="#demo-simulado"
                className="inline-flex items-center gap-2 text-sm font-semibold bg-mkt-accent text-white px-6 py-3 hover:opacity-90 transition-opacity"
              >
                {t('landing.hero.ctaPrimary')}
                <FontAwesomeIcon className="text-xs" icon={faArrowRight} />
              </a>
              <p className="text-mkt-text opacity-50 text-xs">{t('landing.hero.ctaDisclaimer')}</p>
            </div>
          </div>

          <div className="blueprint bg-mkt-bg overflow-visible">
            <BlueprintCorners />

            <div className="flex items-center justify-between px-5 py-3 border-b border-mkt-divider">
              <span className="kick">{config.name}</span>
              <span className="mono text-[11px] text-mkt-text opacity-50">{config.fullName}</span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-mkt-divider border-b border-mkt-divider">
              <div className="bg-mkt-bg px-4 py-4 flex flex-col gap-1">
                <span className="mono text-2xl text-mkt-text">{config.totalQuestions}</span>
                <span className="kick">{t('landing.hero.statQuestions')}</span>
              </div>
              <div className="bg-mkt-bg px-4 py-4 flex flex-col gap-1">
                <span className="mono text-2xl text-mkt-text">{config.examDurationMinutes}min</span>
                <span className="kick">{t('landing.hero.statDuration')}</span>
              </div>
              <div className="bg-mkt-bg px-4 py-4 flex flex-col gap-1">
                <span className="mono text-2xl text-mkt-accent">{config.passingScore}%</span>
                <span className="kick">{t('landing.hero.statPassing')}</span>
              </div>
            </div>

            <div className="p-5">
              <span className="kick">{t('landing.hero.topicsLabel')}</span>
              <div className="flex flex-col gap-2 mt-3">
                {previewTopics.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center px-4 py-2.5 border border-mkt-divider bg-mkt-surface text-sm text-mkt-text opacity-70"
                  >
                    {topic}
                  </div>
                ))}
                {config.topics.length > previewTopics.length && (
                  <span className="mono text-[11px] text-mkt-text opacity-50 mt-1">
                    +{config.topics.length - previewTopics.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
