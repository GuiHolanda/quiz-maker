'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

interface ExamDiagnosisSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamDiagnosisSection({ config }: ExamDiagnosisSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-content2 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <div className="flex-1 min-w-0">
            <div className="bg-content1 border border-divider rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans font-bold text-foreground text-sm">{t('landing.diagnosis.chartTitle')}</span>
              </div>
              {config.topics.slice(0, 5).map((topic, i) => {
                const scores = [78, 45, 91, 33, 62];
                const score = scores[i] ?? 70;
                const color = score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger';
                return (
                  <div key={topic} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-default-500 text-xs font-medium truncate pr-4">{topic}</span>
                      <span className="text-default-400 text-xs font-mono shrink-0">{score}%</span>
                    </div>
                    <div className="h-1.5 bg-content2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
              {config.topics.length > 5 && (
                <p className="text-default-400 text-xs text-center pt-2">
                  +{config.topics.length - 5} tópicos
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="font-playfair font-extrabold text-foreground text-2xl sm:text-3xl">
                {t('landing.diagnosis.heading')}
              </h2>
              <p className="text-default-500 text-base leading-relaxed">
                {t('landing.diagnosis.subheading')}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon className="text-primary text-xs" icon={faChartBar} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-foreground text-sm">
                    {t('landing.diagnosis.heatmap.title')}
                  </span>
                  <span className="text-default-500 text-sm leading-relaxed">
                    {t('landing.diagnosis.heatmap.desc')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon className="text-primary text-xs" icon={faChartLine} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-foreground text-sm">
                    {t('landing.diagnosis.projection.title')}
                  </span>
                  <span className="text-default-500 text-sm leading-relaxed">
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
