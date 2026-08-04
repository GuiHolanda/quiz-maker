'use client';
import { Input } from '@heroui/input';

import { Exam } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { DraftModalShell } from '@/shared/components/ai-chat/DraftModalShell';
import { ExamDistributionTable } from '@/shared/components/ai-chat/ExamDistributionTable';
import { DraftExamMetricsFields } from '@/shared/components/ai-chat/DraftExamMetricsFields';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

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
  const isCertification = draft.type === 'certification';

  const totalTopics = draft.sections.reduce((sum, section) => sum + (section.topics ?? []).length, 0);

  const referenceName = isCertification ? (draft.provider?.name ?? '') : (draft.examBoard?.name ?? '');
  const referenceLabel = isCertification ? t('exam.provider') : t('exam.examBoard');

  const isDistributionValid = draft.sections.every((section) => {
    return section.name.trim() && section.maxQuestions >= section.minQuestions;
  });

  const hasRequiredFields = isCertification
    ? draft.name.trim() !== '' &&
      referenceName.trim() !== '' &&
      (draft.key?.trim() ?? '') !== '' &&
      (draft.totalQuestions ?? 0) > 0
    : draft.name.trim() !== '' &&
      referenceName.trim() !== '' &&
      (draft.role?.trim() ?? '') !== '' &&
      (draft.key?.trim() ?? '') !== '' &&
      draft.year != null &&
      (draft.totalQuestions ?? 0) > 0;

  const canSave = hasRequiredFields && isDistributionValid;

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
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      name={draft.name}
      subtitle={t('exam.extractionSummary', { sections: draft.sections.length, topics: totalTopics })}
      onAddPrimary={addSection}
      onClose={onClose}
      onRetry={handleSaveAndClose}
      onSave={handleSaveAndClose}
    >
      <ExamDistributionTable
        isSaving={isSaving}
        sections={draft.sections}
        onAddTopic={addTopic}
        onRemoveSection={removeSection}
        onRemoveTopic={removeTopic}
        onUpdateSection={updateSection}
        onUpdateTopic={updateTopic}
      />
    </DraftModalShell>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-4">
          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
            isDisabled={isSaving}
            label={t('exam.name')}
            placeholder=" "
            value={draft.name}
            onValueChange={(v) => updateField('name', v)}
            size="sm"
            className="grow"
          />
          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
            isDisabled={isSaving}
            label={t('exam.year')}
            placeholder=" "
            type="number"
            value={draft.year?.toString() ?? ''}
            onValueChange={(v) => updateField('year', v ? parseInt(v, 10) : null)}
            size="sm"
          />
          {isCertification && (
            <Input
              {...inputProperties.input}
              classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
              isDisabled={isSaving}
              label={t('exam.keyLabel')}
              placeholder={t('exam.certKeyPlaceholder')}
              value={draft.key ?? ''}
              onValueChange={(v) => updateField('key', v || null)}
              size="sm"
              className="w-2/5"
            />
          )}
        </div>
        <div className="flex gap-2 justify-between">
          <Input
            {...inputProperties.input}
            classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
            isDisabled={isSaving}
            label={referenceLabel}
            placeholder=" "
            value={referenceName}
            onValueChange={updateReferenceName}
            size="sm"
          />
          {!isCertification && (
            <>
              <div className="flex w-2/5">
                <Input
                  {...inputProperties.input}
                  classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
                  isDisabled={isSaving}
                  label={t('exam.role')}
                  placeholder=" "
                  value={draft.role ?? ''}
                  onValueChange={(v) => updateField('role', v || null)}
                  size="sm"
                />
              </div>
              <div className="flex w-1/5">
                <Input
                  {...inputProperties.input}
                  classNames={{ inputWrapper: 'h-8 bg-background rounded-lg', input: 'text-xs font-semibold' }}
                  isDisabled={isSaving}
                  label={t('exam.editalKeyLabel')}
                  placeholder={t('exam.editalKeyPlaceholder')}
                  value={draft.key ?? ''}
                  onValueChange={(v) => updateField('key', v || null)}
                  size="sm"
                />
              </div>
            </>
          )}
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
