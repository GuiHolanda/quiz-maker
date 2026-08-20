'use client';
import type { ExamSection } from '@/shared/types';

import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getDistributionSumTone, DISTRIBUTION_SUM_TONE_CLASS } from '@/lib/exam-draft-validation';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { ExamDistributionTable } from '@/shared/components/exam-editor/ExamDistributionTable';

interface ExamSectionsCardProps {
  readonly title: string;
  readonly sections: ExamSection[];
  readonly isSaving: boolean;
  readonly sectionCount: number;
  readonly topicCount: number;
  readonly distributionSum: number;
  readonly onAddSection: () => void;
  readonly onUpdateSection: (index: number, patch: Partial<ExamSection>) => void;
  readonly onRemoveSection: (index: number) => void;
  readonly onAddTopic: (sectionIndex: number, name: string) => void;
  readonly onRemoveTopic: (sectionIndex: number, topicIndex: number) => void;
  readonly onUpdateTopic: (sectionIndex: number, topicIndex: number, newName: string) => void;
}

// `title` comes pre-resolved from EXAM_CONFIG so this stays domain-agnostic.
export function ExamSectionsCard({
  title,
  sections,
  isSaving,
  sectionCount,
  topicCount,
  distributionSum,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamSectionsCardProps) {
  const { t } = useTranslation();
  const sumTone = getDistributionSumTone(distributionSum);

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">{title}</div>
          <p className="text-xs text-default-500">
            {t('exam.sectionsCardSubtitle', { sections: sectionCount, topics: topicCount })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-mono text-xl font-medium ${DISTRIBUTION_SUM_TONE_CLASS[sumTone]}`}>
            {Math.round(distributionSum)}%
          </div>
          <div className="font-mono text-[11px] text-default-400 mt-0.5">{t('exam.distributionSumCaption')}</div>
        </div>
      </div>

      <div className="mt-[18px]">
        <ExamDistributionTable
          isSaving={isSaving}
          sections={sections}
          showLabel={false}
          onAddTopic={onAddTopic}
          onRemoveSection={onRemoveSection}
          onRemoveTopic={onRemoveTopic}
          onUpdateSection={onUpdateSection}
          onUpdateTopic={onUpdateTopic}
        />
        {sections.length === 0 && <p className="text-sm text-default-500">{t('exam.aiSeedNoSectionsHint')}</p>}
      </div>

      <div className="flex items-center justify-between gap-6 mt-4">
        <Button className={`${buttonStyles.flat} text-xs`} isDisabled={isSaving} size="sm" onPress={onAddSection}>
          {t('exam.addSection')}
        </Button>
        <span className="text-xs text-default-400 text-right max-w-[420px]">{t('exam.distributionTotalHint')}</span>
      </div>
    </div>
  );
}
