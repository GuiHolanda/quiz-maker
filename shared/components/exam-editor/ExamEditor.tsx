'use client';
import type { Exam, ExamSection } from '@/shared/types';
import type { QuestionFormatKey } from '@/config/question-formats';

import { ExamIdentityFields } from '@/shared/components/exam-editor/ExamIdentityFields';
import { ExamFormatFields } from '@/shared/components/exam-editor/ExamFormatFields';
import { ExamDistributionTable } from '@/shared/components/exam-editor/ExamDistributionTable';
import { getExamDraftValidation } from '@/lib/exam-draft-validation';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ExamEditorProps {
  readonly draft: Exam;
  readonly isSaving: boolean;
  readonly onUpdateField: (
    field: keyof Pick<Exam, 'name' | 'role' | 'year' | 'key'>,
    value: string | number | null
  ) => void;
  readonly onUpdateNumericField: (
    field: 'totalQuestions' | 'examDurationMinutes' | 'passingScore',
    value: number | undefined
  ) => void;
  readonly onUpdateReferenceName: (name: string) => void;
  readonly onUpdateQuestionFormat: (format: QuestionFormatKey) => void;
  readonly onUpdateSection: (index: number, patch: Partial<ExamSection>) => void;
  readonly onRemoveSection: (index: number) => void;
  readonly onAddTopic: (sectionIndex: number, name: string) => void;
  readonly onRemoveTopic: (sectionIndex: number, topicIndex: number) => void;
  readonly onUpdateTopic: (sectionIndex: number, topicIndex: number, newName: string) => void;
}

// Container-agnostic form content — callers own the draft state and their own chrome.
export function ExamEditor({
  draft,
  isSaving,
  onUpdateField,
  onUpdateNumericField,
  onUpdateReferenceName,
  onUpdateQuestionFormat,
  onUpdateSection,
  onRemoveSection,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamEditorProps) {
  const { t } = useTranslation();
  const { isDistributionValid, distributionSum } = getExamDraftValidation(draft);

  return (
    <div className="flex flex-col gap-6">
      <ExamIdentityFields
        draft={draft}
        isSaving={isSaving}
        onUpdateField={onUpdateField}
        onUpdateReferenceName={onUpdateReferenceName}
      />

      <ExamFormatFields
        draft={draft}
        isSaving={isSaving}
        onUpdateNumericField={onUpdateNumericField}
        onUpdateQuestionFormat={onUpdateQuestionFormat}
      />

      <ExamDistributionTable
        isSaving={isSaving}
        sections={draft.sections}
        onAddTopic={onAddTopic}
        onRemoveSection={onRemoveSection}
        onRemoveTopic={onRemoveTopic}
        onUpdateSection={onUpdateSection}
        onUpdateTopic={onUpdateTopic}
      />

      {draft.sections.length > 0 && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${distributionSum === 100 ? 'text-success' : 'text-warning'}`}>
            {t('exam.distributionTotal', { sum: distributionSum })}
          </span>
          {distributionSum !== 100 && (
            <span className="text-xs text-default-400">{t('exam.distributionTotalHint')}</span>
          )}
          {!isDistributionValid && <span className="text-xs text-danger">{t('exam.distributionInvalidHint')}</span>}
        </div>
      )}
    </div>
  );
}
