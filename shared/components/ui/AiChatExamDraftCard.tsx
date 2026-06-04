'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { PublicExam } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface AiChatExamDraftCardProps {
  readonly publicExam: PublicExam;
}

export function AiChatExamDraftCard({ publicExam }: AiChatExamDraftCardProps) {
  const { t } = useTranslation();
  const {
    draft,
    status,
    updateField,
    updateExamBoardName,
    updateSubject,
    removeSubject,
    addSubject,
    addTopic,
    removeTopic,
    handleSave,
  } = useExamDraftCard(publicExam);

  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});

  const isSaving = status === 'saving';
  const isSaved = status === 'saved';

  return (
    <div className="bg-content1 border-2 border-primary rounded-xl p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          {t('chat.examFound')}
        </span>
        {isSaved && (
          <Chip
            color="success"
            size="sm"
            variant="flat"
            startContent={<FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
          >
            {t('chat.saved')}
          </Chip>
        )}
      </div>

      {isSaved ? (
        <div className="space-y-1 text-sm text-default-600">
          <p><span className="font-semibold">{draft.name}</span></p>
          <p>
            {draft.examBoard.name}
            {draft.role ? ` · ${draft.role}` : ''}
            {draft.year ? ` · ${draft.year}` : ''}
          </p>
          <p className="text-xs text-default-400 mt-2">
            {draft.subjects.length} {t('chat.subjects')}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <Input
              {...inputProperties.input}
              label={t('chat.examName')}
              value={draft.name}
              onValueChange={(v) => updateField('name', v)}
              isDisabled={isSaving}
              size="sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                {...inputProperties.input}
                label={t('chat.examBoard')}
                value={draft.examBoard.name}
                onValueChange={updateExamBoardName}
                isDisabled={isSaving}
                size="sm"
              />
              <Input
                {...inputProperties.input}
                label={t('chat.examRole')}
                value={draft.role ?? ''}
                onValueChange={(v) => updateField('role', v || null)}
                isDisabled={isSaving}
                size="sm"
              />
            </div>
            <Input
              {...inputProperties.input}
              label={t('chat.examYear')}
              type="number"
              value={draft.year?.toString() ?? ''}
              onValueChange={(v) => updateField('year', v ? parseInt(v, 10) : null)}
              isDisabled={isSaving}
              size="sm"
            />
          </div>

          <div className="space-y-3 mb-4">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wide">
              {t('chat.subjects')}
            </span>

            {draft.subjects.map((subject, si) => (
              <div key={si} className="border border-default-200 rounded-lg p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    {...inputProperties.input}
                    placeholder={t('chat.subjectName')}
                    value={subject.name}
                    onValueChange={(v) => updateSubject(si, { name: v })}
                    isDisabled={isSaving}
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeSubject(si)}
                    isDisabled={isSaving}
                    aria-label={t('chat.removeSubject')}
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...inputProperties.input}
                    label={t('chat.minQuestions')}
                    type="number"
                    value={subject.minQuestions.toString()}
                    onValueChange={(v) => updateSubject(si, { minQuestions: parseFloat(v) || 0 })}
                    isDisabled={isSaving}
                    size="sm"
                    endContent={<span className="text-xs text-default-400">%</span>}
                  />
                  <Input
                    {...inputProperties.input}
                    label={t('chat.maxQuestions')}
                    type="number"
                    value={subject.maxQuestions.toString()}
                    onValueChange={(v) => updateSubject(si, { maxQuestions: parseFloat(v) || 0 })}
                    isDisabled={isSaving}
                    size="sm"
                    endContent={<span className="text-xs text-default-400">%</span>}
                  />
                </div>

                {(subject.topics ?? []).length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {(subject.topics ?? []).map((topic, ti) => (
                      <div
                        key={ti}
                        className="flex items-start justify-between gap-2 rounded-md px-2 py-1 bg-default-100 hover:bg-default-200 transition-colors group"
                      >
                        <span className="text-xs text-default-600 break-words min-w-0 leading-relaxed">
                          {topic.name}
                        </span>
                        {!isSaving && (
                          <button
                            type="button"
                            onClick={() => removeTopic(si, ti)}
                            className="shrink-0 text-default-300 hover:text-danger transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
                            aria-label={`Remove ${topic.name}`}
                          >
                            <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    {...inputProperties.input}
                    placeholder={t('chat.addTopic')}
                    value={newTopicInputs[si] ?? ''}
                    onValueChange={(v) => setNewTopicInputs(prev => ({ ...prev, [si]: v }))}
                    isDisabled={isSaving}
                    size="sm"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTopicInputs[si]?.trim()) {
                        addTopic(si, newTopicInputs[si]);
                        setNewTopicInputs(prev => ({ ...prev, [si]: '' }));
                      }
                    }}
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      if (newTopicInputs[si]?.trim()) {
                        addTopic(si, newTopicInputs[si]);
                        setNewTopicInputs(prev => ({ ...prev, [si]: '' }));
                      }
                    }}
                    isDisabled={isSaving || !newTopicInputs[si]?.trim()}
                    aria-label={t('chat.addTopic')}
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              size="sm"
              variant="flat"
              onPress={addSubject}
              isDisabled={isSaving}
              startContent={<FontAwesomeIcon icon={faPlus} className="w-3 h-3" />}
            >
              {t('chat.addSubject')}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onPress={handleSave}
              isDisabled={isSaving || !draft.name.trim() || !draft.examBoard.name.trim()}
              className="bg-primary text-primary-foreground font-semibold rounded-lg"
              startContent={isSaving ? <Spinner size="sm" color="current" /> : undefined}
            >
              {isSaving ? t('chat.saving') : t('chat.saveExam')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
