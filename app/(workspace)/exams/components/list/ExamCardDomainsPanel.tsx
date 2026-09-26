'use client';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { readinessTone } from '@/shared/lib/examReadiness';
import { toneBg, toneText } from '@/shared/lib/scoreTone';
import type { ExamReadiness, ExamSection, SectionReadiness } from '@/shared/types';

interface ExamCardDomainsPanelProps {
  readonly sections: ExamSection[];
  readonly readiness: ExamReadiness | undefined;
  readonly passingScore: number | null;
}

export function ExamCardDomainsPanel({ sections, readiness, passingScore }: ExamCardDomainsPanelProps) {
  const { t } = useTranslation();
  const readinessBySection = new Map((readiness?.sections ?? []).map((entry) => [entry.sectionId, entry]));

  return (
    <div className="mt-3 rounded-lg bg-background border border-default-200 dark:border-transparent p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-default-400">{t('exam.readinessDomainsTitle')}</p>
        <p className="text-xs text-default-400">{t('exam.readinessDomainsLegend')}</p>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {sections.map((section) => {
          const entry = section.id ? readinessBySection.get(section.id) : undefined;

          return (
            <div
              key={section.id ?? section.name}
              className="flex items-center gap-3"
              data-testid="exam-card-domain-row"
            >
              <span className="text-sm text-default-500 w-1/3 shrink-0 truncate" title={section.name}>
                {section.name}
              </span>
              {renderAccuracy(entry)}
              {renderBank(entry)}
            </div>
          );
        })}
      </div>
    </div>
  );

  function renderAccuracy(entry: SectionReadiness | undefined) {
    const accuracy = entry?.accuracyPercent ?? null;

    if (accuracy === null) {
      return (
        <>
          <ProgressTrack className="flex-1" heightClass="h-[3px]" trackClass="bg-default-100" value={0} />
          <span className="text-xs text-default-400 w-20 text-right shrink-0">{t('exam.readinessUntested')}</span>
        </>
      );
    }

    const tone = readinessTone(accuracy, passingScore);

    return (
      <>
        <ProgressTrack
          className="flex-1"
          fillClass={toneBg(tone)}
          heightClass="h-[3px]"
          trackClass="bg-default-100"
          value={accuracy}
        />
        <span className={`font-mono text-xs w-20 text-right shrink-0 ${toneText(tone)}`}>{accuracy}%</span>
      </>
    );
  }

  function renderBank(entry: SectionReadiness | undefined) {
    if (!entry) return <span className="w-12 shrink-0" />;

    const covered = Math.min(entry.questionCount, entry.targetCount);

    return (
      <span className="font-mono text-xs text-default-400 w-12 text-right shrink-0">
        {covered}/{entry.targetCount}
      </span>
    );
  }
}
