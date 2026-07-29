'use client';
import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPen, faCheck, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { PublicExam, PublicExamSubject, PublicExamTopic } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { DraftReviewModal } from '@/shared/components/ai-chat/DraftReviewModal';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const TH =
  'text-left font-mono text-[11px] text-default-400 uppercase tracking-widest px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

interface ExamDraftReviewModalProps {
  readonly publicExam: PublicExam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (savedDraft: PublicExam) => void;
}

export function ExamDraftReviewModal({ publicExam, isOpen, onClose, onSaved }: ExamDraftReviewModalProps) {
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
    updateTopic,
    handleSave,
  } = useExamDraftCard(publicExam);

  const [expandedSubjects, setExpandedSubjects] = useState<Record<number, boolean>>({});
  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});
  const [editingTopics, setEditingTopics] = useState<Record<string, string | null>>({});
  const [confirmRemoveSubject, setConfirmRemoveSubject] = useState<number | null>(null);

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
    <DraftReviewModal
      addLabel={t('chat.addSubject')}
      canSave={canSave}
      error={
        hasError
          ? {
              title: t('chat.examSaveError'),
              description: t('chat.examSaveErrorDescription'),
              onRetry: handleSaveAndClose,
            }
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
      {renderSubjectsSection()}
    </DraftReviewModal>
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
              value={draft.name}
              onValueChange={(v) => updateField('name', v)}
            />
          </div>
          <div className="flex w-1/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.examYear')}
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
            value={draft.examBoard.name}
            onValueChange={updateExamBoardName}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.examRole')}
            value={draft.role ?? ''}
            onValueChange={(v) => updateField('role', v || null)}
          />
        </div>
      </div>
    );
  }

  function renderSubjectsSection() {
    if (draft.subjects.length === 0) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-default-500 uppercase tracking-wide mb-3">{t('chat.subjects')}</p>
        <div className="w-full rounded-xl border border-default-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-content2">
              <tr>
                <th className={TH}>{t('chat.subjectName')}</th>
                <th className={TH}>{t('chat.minQuestions')}</th>
                <th className={TH}>{t('chat.maxQuestions')}</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>{draft.subjects.map((subject, si) => renderSubjectRow(subject, si))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSubjectRow(subject: PublicExamSubject, si: number) {
    const isExpanded = !!expandedSubjects[si];

    return (
      <React.Fragment key={si}>
        {renderSubjectHeaderRow(subject, si, isExpanded)}
        {isExpanded && (subject.topics ?? []).map((topic, ti) => renderTopicRow(topic, si, ti))}
        {isExpanded && renderAddTopicRow(si, si === draft.subjects.length - 1)}
      </React.Fragment>
    );
  }

  function renderSubjectHeaderRow(subject: PublicExamSubject, si: number, isExpanded: boolean) {
    const topicCount = (subject.topics ?? []).length;

    return (
      <tr key={`subject-${si}`} className="bg-content2">
        <td className={TD}>
          <div className="flex items-center gap-2">
            <button
              aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
              className="shrink-0 p-1 rounded text-default-400 hover:text-primary transition-colors"
              type="button"
              onClick={() => setExpandedSubjects((prev) => ({ ...prev, [si]: !prev[si] }))}
            >
              <FontAwesomeIcon className="w-3 h-3" icon={isExpanded ? faChevronDown : faChevronRight} />
            </button>
            <Input
              {...inputProperties.input}
              aria-label={t('chat.subjectName')}
              className="min-w-0 flex-1"
              isDisabled={isSaving}
              size="sm"
              value={subject.name}
              onValueChange={(v) => updateSubject(si, { name: v })}
            />
            {!isExpanded && topicCount > 0 && (
              <span className="shrink-0 text-xs text-default-400 whitespace-nowrap">
                {topicCount} {t('chat.topics')}
              </span>
            )}
          </div>
        </td>
        <td className={TD}>
          <Input
            {...inputProperties.input}
            aria-label={t('chat.minQuestions')}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={subject.minQuestions.toString()}
            onValueChange={(v) => updateSubject(si, { minQuestions: parseFloat(v) || 0 })}
          />
        </td>
        <td className={TD}>
          <Input
            {...inputProperties.input}
            aria-label={t('chat.maxQuestions')}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={subject.maxQuestions.toString()}
            onValueChange={(v) => updateSubject(si, { maxQuestions: parseFloat(v) || 0 })}
          />
        </td>
        <td className={TD}>
          <Popover
            isOpen={confirmRemoveSubject === si}
            placement="left"
            onOpenChange={(open) => setConfirmRemoveSubject(open ? si : null)}
          >
            <PopoverTrigger>
              <Button className={`${buttonStyles.dangerFlat} text-xs h-8 px-3`} isDisabled={isSaving} size="sm">
                {t('common.remove')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 max-w-xs">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-foreground">{t('chat.removeSubjectConfirm')}</p>
                <p className="text-xs text-default-500">{t('chat.removeSubjectConfirmBody')}</p>
                <div className="flex gap-2 justify-end">
                  <Button
                    className="text-xs h-7 px-3"
                    size="sm"
                    variant="flat"
                    onPress={() => setConfirmRemoveSubject(null)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    className={`${buttonStyles.danger} text-xs h-7 px-3`}
                    size="sm"
                    onPress={() => {
                      removeSubject(si);
                      setConfirmRemoveSubject(null);
                    }}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </td>
      </tr>
    );
  }

  function renderTopicRow(topic: PublicExamTopic, si: number, ti: number) {
    const editKey = `${si}-${ti}`;
    const isEditingTopic = editingTopics[editKey] != null;
    const editValue = editingTopics[editKey] ?? '';

    if (isEditingTopic) {
      return (
        <tr key={`topic-edit-${si}-${ti}`} className="bg-content1">
          <td className={TD} colSpan={4}>
            <div className="flex items-center gap-1.5 pl-8">
              <Input
                {...inputProperties.input}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="flex-1"
                size="sm"
                value={editValue}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editValue.trim()) {
                    updateTopic(si, ti, editValue);
                    setEditingTopics((prev) => ({ ...prev, [editKey]: null }));
                  }
                  if (e.key === 'Escape') {
                    setEditingTopics((prev) => ({ ...prev, [editKey]: null }));
                  }
                }}
                onValueChange={(v) => setEditingTopics((prev) => ({ ...prev, [editKey]: v }))}
              />
              <Button
                isIconOnly
                aria-label={t('common.save')}
                className={`${buttonStyles.iconOnly.primary} h-7 w-7 min-w-0 shrink-0`}
                isDisabled={!editValue.trim()}
                size="sm"
                onPress={() => {
                  if (editValue.trim()) {
                    updateTopic(si, ti, editValue);
                    setEditingTopics((prev) => ({ ...prev, [editKey]: null }));
                  }
                }}
              >
                <FontAwesomeIcon className="w-3 h-3" icon={faCheck} />
              </Button>
              <button
                aria-label={t('common.cancel')}
                className="p-1 rounded text-default-400 hover:text-danger transition-colors shrink-0"
                type="button"
                onClick={() => setEditingTopics((prev) => ({ ...prev, [editKey]: null }))}
              >
                <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={`topic-${si}-${ti}`} className="bg-content1 group">
        <td className={TD} colSpan={4}>
          <div className="flex items-center justify-between gap-2 pl-8 py-0.5">
            <span className="text-xs text-default-700 leading-relaxed flex-1">{topic.name}</span>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              {!isSaving && (
                <button
                  aria-label={t('common.edit')}
                  className="p-1 rounded text-default-400 hover:text-primary hover:bg-default-200 transition-colors"
                  type="button"
                  onClick={() => setEditingTopics((prev) => ({ ...prev, [editKey]: topic.name }))}
                >
                  <FontAwesomeIcon className="w-2.5 h-2.5" icon={faPen} />
                </button>
              )}
              {!isSaving && (
                <button
                  aria-label={t('chat.removeTopicNamed', { name: topic.name })}
                  className="p-1 rounded text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
                  type="button"
                  onClick={() => removeTopic(si, ti)}
                >
                  <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  function renderAddTopicRow(si: number, isLastSubject: boolean) {
    const tdClass = isLastSubject ? TD_LAST : TD;
    return (
      <tr key={`add-topic-${si}`} className="bg-content1">
        <td className={tdClass} colSpan={4}>
          <div className="flex gap-1 items-center pl-8">
            <Input
              {...inputProperties.input}
              className="w-56"
              isDisabled={isSaving}
              placeholder={t('chat.addTopic')}
              size="sm"
              value={newTopicInputs[si] ?? ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTopicInputs[si]?.trim()) {
                  addTopic(si, newTopicInputs[si]);
                  setNewTopicInputs((prev) => ({ ...prev, [si]: '' }));
                }
              }}
              onValueChange={(v) => setNewTopicInputs((prev) => ({ ...prev, [si]: v }))}
            />
            <Button
              className={`${buttonStyles.primarySm} h-7 px-2`}
              isDisabled={isSaving || !newTopicInputs[si]?.trim()}
              size="sm"
              onPress={() => {
                if (newTopicInputs[si]?.trim()) {
                  addTopic(si, newTopicInputs[si]);
                  setNewTopicInputs((prev) => ({ ...prev, [si]: '' }));
                }
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </td>
      </tr>
    );
  }
}
