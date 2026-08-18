'use client';
import { Exam } from '@/shared/types';
import { useExamDraftCard, getExamDraftValidation } from '@/features/hooks/useExamDraftCard.hook';
import { DraftModalShell } from '@/shared/components/ai-chat/DraftModalShell';
import { ExamEditor } from '@/shared/components/exam-editor/ExamEditor';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ExamModalProps {
  readonly data: Exam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: Exam) => void;
}

export function ExamModal({ data, isOpen, onClose, onSaved }: ExamModalProps) {
  const { t } = useTranslation();
  const {
    draft,
    status,
    updateField,
    updateNumericField,
    updateReferenceName,
    updateQuestionFormat,
    updateSection,
    removeSection,
    addSection,
    addTopic,
    removeTopic,
    updateTopic,
    handleSave,
  } = useExamDraftCard(data);

  const isSaving = status === 'saving';
  const hasError = status === 'error';
  const totalTopics = draft.sections.reduce((sum, section) => sum + (section.topics ?? []).length, 0);
  const { canSave } = getExamDraftValidation(draft);

  const handleSaveAndClose = async () => {
    const result = await handleSave();
    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <DraftModalShell
      addLabel={t('exam.addSection')}
      canSave={canSave}
      hasError={hasError}
      isOpen={isOpen}
      isSaving={isSaving}
      name={draft.name}
      subtitle={t('exam.extractionSummary', { sections: draft.sections.length, topics: totalTopics })}
      onAddPrimary={addSection}
      onClose={onClose}
      onRetry={handleSaveAndClose}
      onSave={handleSaveAndClose}
    >
      <ExamEditor
        draft={draft}
        isSaving={isSaving}
        onAddTopic={addTopic}
        onRemoveSection={removeSection}
        onRemoveTopic={removeTopic}
        onUpdateField={updateField}
        onUpdateNumericField={updateNumericField}
        onUpdateQuestionFormat={updateQuestionFormat}
        onUpdateReferenceName={updateReferenceName}
        onUpdateSection={updateSection}
        onUpdateTopic={updateTopic}
      />
    </DraftModalShell>
  );
}
