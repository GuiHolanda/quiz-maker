'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

import { formatExamDuration } from './examLandingMetrics';

interface ExamFactsStripProps {
  readonly config: ExamLandingConfig;
}

export function ExamFactsStrip({ config }: ExamFactsStripProps) {
  const { t } = useTranslation();

  const facts = [
    { key: 'provider', value: config.provider },
    { key: 'questions', value: String(config.totalQuestions) },
    { key: 'duration', value: formatExamDuration(config.examDurationMinutes) },
    { key: 'passing', value: t('landing.facts.passingValue', { score: config.passingScore }) },
  ] as const;

  return (
    <div className="border-b border-mkt-divider bg-mkt-divider">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
        {facts.map((fact) => (
          <div key={fact.key} className="bg-mkt-surface px-6 py-5">
            <p className="mono text-lg sm:text-xl font-medium text-mkt-text leading-tight">{fact.value}</p>
            <p className="text-xs text-mkt-text opacity-60 mt-1">{t(`landing.facts.${fact.key}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
