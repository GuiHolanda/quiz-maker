'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

interface ExamLandingHeroProps {
  readonly config: ExamLandingConfig;
}

export function ExamLandingHero({ config }: ExamLandingHeroProps) {
  const { t } = useTranslation();

  return (
    <section data-theme="dark" className="bg-background pt-16 pb-20 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="font-sora font-extrabold text-white text-4xl sm:text-5xl xl:text-6xl leading-tight">
              {config.heroHeadline.split(config.name).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-primary">{config.name}</span>}
                </span>
              ))}
            </h1>

            <p className="text-default-400 text-base sm:text-lg leading-relaxed max-w-lg">{config.heroSubheadline}</p>

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

          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-content1 border border-divider rounded-2xl p-8 flex flex-col gap-6">
              <span className="font-mono text-xs text-default-400 uppercase tracking-widest">{config.provider}</span>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-sora font-extrabold text-2xl text-foreground">{config.totalQuestions}</span>
                  <span className="text-xs text-default-400">{t('landing.hero.statQuestions')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-sora font-extrabold text-2xl text-foreground">{config.passingScore}%</span>
                  <span className="text-xs text-default-400">{t('landing.hero.statPassing')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-sora font-extrabold text-2xl text-foreground">
                    {config.examDurationMinutes}
                  </span>
                  <span className="text-xs text-default-400">{t('landing.hero.statMinutes')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-sora font-extrabold text-2xl text-foreground">{config.topics.length}</span>
                  <span className="text-xs text-default-400">{t('landing.hero.statTopics')}</span>
                </div>
              </div>

              <div className="border-t border-divider" />

              <div className="flex flex-wrap gap-2">
                {config.topics.slice(0, 4).map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center font-mono text-xs bg-content2 border border-divider text-default-400 rounded-full px-3 py-1"
                  >
                    {topic}
                  </span>
                ))}
                {config.topics.length > 4 && (
                  <span className="inline-flex items-center font-mono text-xs bg-content2 border border-divider text-default-400 rounded-full px-3 py-1">
                    +{config.topics.length - 4}
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
