'use client';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamSection } from '@/shared/types';

interface ExamCardDomainsPanelProps {
  readonly sections: ExamSection[];
}

export function ExamCardDomainsPanel({ sections }: ExamCardDomainsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 rounded-lg bg-background border border-default-200 dark:border-transparent p-4">
      <p className="text-xs font-semibold text-default-400">{t('exam.readinessLabel')}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {sections.map((section) => (
          <div key={section.id ?? section.name} className="flex items-center gap-3">
            <span className="text-sm text-default-500 min-w-0 flex-shrink truncate max-w-[40%]">{section.name}</span>
            <ProgressTrack
              className="flex-1"
              heightClass="h-[3px]"
              trackClass="bg-default-100"
              value={section.minQuestions}
            />
            <span className="font-mono text-xs text-default-400 w-10 text-right shrink-0">{section.minQuestions}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
