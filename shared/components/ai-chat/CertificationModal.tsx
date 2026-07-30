'use client';
import { Input } from '@heroui/input';

import { Certification } from '@/shared/types';
import { useCertificationDraftCard } from '@/features/hooks/useCertificationDraftCard.hook';
import { DraftModalShell } from '@/shared/components/ai-chat/DraftModalShell';
import { CertificationTopicsTable } from '@/shared/components/ai-chat/CertificationTopicsTable';
import { DraftExamMetricsFields } from '@/shared/components/ai-chat/DraftExamMetricsFields';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface CertificationModalProps {
  readonly data: Certification;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: Certification) => void;
}

export function CertificationModal({ data, isOpen, onClose, onSaved }: CertificationModalProps) {
  const { t } = useTranslation();
  const { draft, status, updateField, updateNumericField, updateTopic, addTopic, removeTopic, handleSave } =
    useCertificationDraftCard(data);

  const isSaving = status === 'saving';
  const hasError = status === 'error';
  const canSave = draft.label.trim() !== '' && draft.key.trim() !== '';

  const handleSaveAndClose = async () => {
    const result = await handleSave();
    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <DraftModalShell
      addLabel={t('chat.addTopicShort')}
      canSave={canSave}
      hasError={hasError}
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      name={draft.label}
      onAddPrimary={addTopic}
      onClose={onClose}
      onRetry={handleSaveAndClose}
      onSave={handleSaveAndClose}
    >
      <CertificationTopicsTable
        isSaving={isSaving}
        topics={draft.topics}
        onRemoveTopic={removeTopic}
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
              label={t('chat.certificationLabel')}
              placeholder=" "
              size="sm"
              value={draft.label}
              onValueChange={(v) => updateField('label', v)}
            />
          </div>
          <div className="flex w-1/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.certificationYear')}
              placeholder=" "
              size="sm"
              type="number"
              value={draft.year?.toString() ?? ''}
              onValueChange={(v) => updateNumericField('year', v ? parseInt(v, 10) : undefined)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationKey')}
            placeholder=" "
            size="sm"
            value={draft.key}
            onValueChange={(v) => updateField('key', v)}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationProvider')}
            placeholder=" "
            size="sm"
            value={draft.provider ?? ''}
            onValueChange={(v) => updateField('provider', v)}
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
