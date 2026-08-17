'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

const SAMPLE_SCORES = [78, 45, 91, 33, 62] as const;

interface ExamDiagnosisSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamDiagnosisSection({ config }: ExamDiagnosisSectionProps) {
  const { t } = useTranslation();
  const chartTopics = config.topics.slice(0, 5);

  return (
    <section className="bg-mkt-surface border-t border-mkt-divider py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <div className="flex-1 min-w-0 w-full">
            <div className="blueprint bg-mkt-bg overflow-visible p-6 flex flex-col gap-4">
              <BlueprintCorners />
              <span className="kick">{t('landing.diagnosis.chartTitle')}</span>
              {chartTopics.map((topic, i) => {
                const score = SAMPLE_SCORES[i] ?? 70;
                return (
                  <div key={topic} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-mkt-text opacity-70 text-xs font-medium truncate pr-4">{topic}</span>
                      <span className="mono text-xs text-mkt-text opacity-50 shrink-0">{score}%</span>
                    </div>
                    <div className="h-1.5 bg-mkt-surface overflow-hidden">
                      <div className="h-full bg-mkt-accent" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
              {config.topics.length > chartTopics.length && (
                <span className="mono text-[11px] text-mkt-text opacity-50 text-center pt-1">
                  +{config.topics.length - chartTopics.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="kick">{t('landing.diagnosis.kick')}</span>
              <h2 className="ds-heading text-mkt-text text-3xl mt-1">{t('landing.diagnosis.heading')}</h2>
              <p className="text-mkt-text opacity-60 text-base leading-relaxed">{t('landing.diagnosis.subheading')}</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-mkt-accent-100 border border-mkt-accent flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon className="text-mkt-accent text-xs" icon={faChartBar} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-mkt-text text-sm">{t('landing.diagnosis.heatmap.title')}</span>
                  <span className="text-mkt-text opacity-60 text-sm leading-relaxed">
                    {t('landing.diagnosis.heatmap.desc')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-mkt-accent-100 border border-mkt-accent flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon className="text-mkt-accent text-xs" icon={faChartLine} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-mkt-text text-sm">{t('landing.diagnosis.projection.title')}</span>
                  <span className="text-mkt-text opacity-60 text-sm leading-relaxed">
                    {t('landing.diagnosis.projection.desc')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
