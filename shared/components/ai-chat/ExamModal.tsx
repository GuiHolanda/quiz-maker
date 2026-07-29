'use client';
import { Input } from '@heroui/input';

import { PublicExam } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { DraftModalShell } from '@/shared/components/ai-chat/DraftModalShell';
import { ExamDistributionTable } from '@/shared/components/ai-chat/ExamDistributionTable';
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
      error={
        hasError
          ? { title: t('chat.examSaveError'), description: t('chat.examSaveErrorDescription'), onRetry: handleSaveAndClose }
          : null
      }
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      saveLabel={isSaving ? t('chat.saving') : t('chat.saveExam')}
      subtitle={t('chat.examExtractionSummary', { subjects: draft.subjects.length, topics: totalTopics })}
      title={t('chat.examFound')}
      onAddPrimary={addSubject}
      onClose={onClose}
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
        <div className="grid grid-cols-3 gap-4">
          <Input
            isRequired
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('certification.totalQuestions')}
            min={1}
            placeholder="e.g. 65"
            size="sm"
            type="number"
            value={draft.totalQuestions != null ? String(draft.totalQuestions) : ''}
            onValueChange={(v) => updateNumericField('totalQuestions', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={
              <span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>
            }
            isDisabled={isSaving}
            label={t('certification.examDuration')}
            min={1}
            placeholder="e.g. 130"
            size="sm"
            type="number"
            value={draft.examDurationMinutes != null ? String(draft.examDurationMinutes) : ''}
            onValueChange={(v) => updateNumericField('examDurationMinutes', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={<span className="text-xs text-default-400 self-center">%</span>}
            isDisabled={isSaving}
            label={t('certification.passingScore')}
            max={100}
            min={0}
            placeholder="e.g. 72"
            size="sm"
            type="number"
            value={draft.passingScore != null ? String(draft.passingScore) : ''}
            onValueChange={(v) => updateNumericField('passingScore', parseFloat(v) || undefined)}
          />
        </div>
      </div>
    );
  }
}
