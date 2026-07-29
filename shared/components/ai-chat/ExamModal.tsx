'use client';
import { Input } from '@heroui/input';

import { PublicExam } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { DraftModalShell } from '@/shared/components/ai-chat/DraftModalShell';
import { ExamDistributionTable } from '@/shared/components/ai-chat/ExamDistributionTable';
import { DraftExamMetricsFields } from '@/shared/components/ai-chat/DraftExamMetricsFields';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ExamModalProps {
  readonly data: PublicExam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: PublicExam) => void;
}

export function ExamModal({ data, isOpen, onClose, onSaved }: ExamModalProps) {
  const { t } = useTranslation();
  const {
    draft,
    status,
    updateField,
    updateNumericField,
    updateExamBoardName,
    updateSubject,
    removeSubject,
    addSubject,
    addTopic,
    removeTopic,
    updateTopic,
    handleSave,
  } = useExamDraftCard(data);

  const isSaving = status === 'saving';
  const hasError = status === 'error';

  const totalTopics = draft.subjects.reduce((sum, subject) => sum + (subject.topics ?? []).length, 0);

  const isDistributionValid = draft.subjects.every((subject) => {
    return subject.name.trim() && subject.maxQuestions >= subject.minQuestions;
  });

  const canSave = draft.name.trim() !== '' && draft.examBoard.name.trim() !== '' && isDistributionValid;

  const handleSaveAndClose = async () => {
    const result = await handleSave();
    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <DraftModalShell
      addLabel={t('chat.addSubject')}
      canSave={canSave}
      hasError={hasError}
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      name={draft.name}
      subtitle={t('chat.examExtractionSummary', { subjects: draft.subjects.length, topics: totalTopics })}
      onAddPrimary={addSubject}
      onClose={onClose}
      onRetry={handleSaveAndClose}
      onSave={handleSaveAndClose}
    >
      <ExamDistributionTable
        isSaving={isSaving}
        subjects={draft.subjects}
        onAddTopic={addTopic}
        onRemoveSubject={removeSubject}
        onRemoveTopic={removeTopic}
        onUpdateSubject={updateSubject}
        onUpdateTopic={updateTopic}
      />
    </DraftModalShell>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex w-3/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.examName')}
              placeholder=" "
              value={draft.name}
              onValueChange={(v) => updateField('name', v)}
            />
          </div>
          <div className="flex w-1/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.examYear')}
              placeholder=" "
              type="number"
              value={draft.year?.toString() ?? ''}
              onValueChange={(v) => updateField('year', v ? parseInt(v, 10) : null)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.examBoard')}
            placeholder=" "
            value={draft.examBoard.name}
            onValueChange={updateExamBoardName}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.examRole')}
            placeholder=" "
            value={draft.role ?? ''}
            onValueChange={(v) => updateField('role', v || null)}
          />
        </div>
        <DraftExamMetricsFields
          examDurationMinutes={draft.examDurationMinutes}
          isSaving={isSaving}
          passingScore={draft.passingScore}
          totalQuestions={draft.totalQuestions}
          onExamDurationChange={(v) => updateNumericField('examDurationMinutes', v)}
          onPassingScoreChange={(v) => updateNumericField('passingScore', v)}
          onTotalQuestionsChange={(v) => updateNumericField('totalQuestions', v)}
        />
      </div>
    );
  }
}
