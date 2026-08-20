'use client';
import { ExamSection } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ExamSectionRow, DISTRIBUTION_GRID_COLS } from '@/shared/components/exam-editor/ExamSectionRow';

interface ExamDistributionTableProps {
  readonly sections: ExamSection[];
  readonly isSaving: boolean;
  // False when the caller already renders its own title (e.g. ExamSectionsCard).
  readonly showLabel?: boolean;
  readonly onUpdateSection: (index: number, patch: Partial<ExamSection>) => void;
  readonly onRemoveSection: (index: number) => void;
  readonly onAddTopic: (sectionIndex: number, name: string) => void;
  readonly onRemoveTopic: (sectionIndex: number, topicIndex: number) => void;
  readonly onUpdateTopic: (sectionIndex: number, topicIndex: number, newName: string) => void;
}

const HEADER_CELL = 'font-mono text-[11px] uppercase tracking-widest text-default-400';

// CSS grid, not a <table> — [&>*:last-child]:border-b-0 strips the trailing border instead
// of threading isLastSection bookkeeping through the row components.
export function ExamDistributionTable({
  sections,
  isSaving,
  showLabel = true,
  onUpdateSection,
  onRemoveSection,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamDistributionTableProps) {
  const { t } = useTranslation();

  if (sections.length === 0) return null;

  return (
    <div>
      {showLabel && <p className="text-xs font-semibold text-default-500 mb-3">{t('exam.sections')}</p>}
      <div className="w-full rounded-xl border border-default-200 overflow-hidden [&>*:last-child]:border-b-0">
        <div className={`${DISTRIBUTION_GRID_COLS} px-3 py-2.5 bg-content2 border-b border-default-200`}>
          <span />
          <span className={HEADER_CELL}>{t('exam.sectionName')}</span>
          <span />
          <span className={`${HEADER_CELL} text-right`}>{t('exam.minQuestions')}</span>
          <span className={`${HEADER_CELL} text-right`}>{t('exam.maxQuestions')}</span>
          <span />
        </div>

        {sections.map((section, si) => (
          <ExamSectionRow
            key={section.id ?? si}
            isSaving={isSaving}
            section={section}
            onAddTopic={(name) => onAddTopic(si, name)}
            onRemove={() => onRemoveSection(si)}
            onRemoveTopic={(topicIndex) => onRemoveTopic(si, topicIndex)}
            onUpdate={(patch) => onUpdateSection(si, patch)}
            onUpdateTopic={(topicIndex, newName) => onUpdateTopic(si, topicIndex, newName)}
          />
        ))}
      </div>
    </div>
  );
}
