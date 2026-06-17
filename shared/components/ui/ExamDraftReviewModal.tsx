'use client';
import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark, faChevronDown, faChevronRight, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

import { PublicExam, PublicExamSubject } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface ExamDraftReviewModalProps {
  readonly publicExam: PublicExam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (savedDraft: PublicExam) => void;
}

const TH = 'text-left text-xs font-semibold text-default-400 px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

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
  // editing state: key is `${si}-${ti}`, value is current edit text or null (not editing)
  const [editingTopics, setEditingTopics] = useState<Record<string, string | null>>({});

  const isSaving = status === 'saving';

  const handleSaveAndClose = async () => {
    await handleSave();
    onSaved(draft);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">{t('chat.examFound')}</p>
          <p className="text-xs text-default-400 font-normal">{draft.name}</p>
        </ModalHeader>

        <ModalBody className="gap-6">
          {renderHeaderFields()}
          {renderSubjectsSection()}
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button
              className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg"
              isDisabled={isSaving}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faPlus} />}
              variant="flat"
              onPress={addSubject}
            >
              {t('chat.addSubject')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg"
              isDisabled={isSaving || !draft.name.trim() || !draft.examBoard.name.trim()}
              size="sm"
              startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
              onPress={handleSaveAndClose}
            >
              {isSaving ? t('chat.saving') : t('chat.saveExam')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-4">
        <Input
          {...inputProperties.input}
          isDisabled={isSaving}
          label={t('chat.examName')}
          value={draft.name}
          onValueChange={(v) => updateField('name', v)}
        />
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
        <div className="grid grid-cols-2 gap-4">
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
    );
  }

  function renderSubjectsSection() {
    if (draft.subjects.length === 0) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-default-500 uppercase tracking-wide mb-3">{t('chat.subjects')}</p>
        <div className="w-full rounded-xl border border-default-200">
          <table className="w-full border-collapse">
            <thead className="bg-default-100">
              <tr>
                <th className={TH}>{t('chat.subjectName')}</th>
                <th className={TH}>{t('chat.minQuestions')}</th>
                <th className={TH}>{t('chat.maxQuestions')}</th>
                <th className={TH}>{t('chat.topics')}</th>
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
    const isLast = si === draft.subjects.length - 1 && !isExpanded;
    const tdClass = isLast ? TD_LAST : TD;
    const rowBg = si % 2 === 0 ? 'bg-content1' : 'bg-default-50';
    const topicCount = (subject.topics ?? []).length;

    return (
      <React.Fragment key={si}>
        <tr className={rowBg}>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              className="min-w-0"
              isDisabled={isSaving}
              size="sm"
              value={subject.name}
              onValueChange={(v) => updateSubject(si, { name: v })}
            />
          </td>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              className="w-24"
              endContent={<span className="text-xs text-default-400">%</span>}
              isDisabled={isSaving}
              size="sm"
              type="number"
              value={subject.minQuestions.toString()}
              onValueChange={(v) => updateSubject(si, { minQuestions: parseFloat(v) || 0 })}
            />
          </td>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              className="w-24"
              endContent={<span className="text-xs text-default-400">%</span>}
              isDisabled={isSaving}
              size="sm"
              type="number"
              value={subject.maxQuestions.toString()}
              onValueChange={(v) => updateSubject(si, { maxQuestions: parseFloat(v) || 0 })}
            />
          </td>
          <td className={tdClass}>
            <button
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-default-100 hover:bg-default-200 transition-colors text-xs text-default-600 font-medium"
              type="button"
              onClick={() => setExpandedSubjects((prev) => ({ ...prev, [si]: !prev[si] }))}
            >
              <FontAwesomeIcon
                className="w-2.5 h-2.5 text-default-400"
                icon={isExpanded ? faChevronDown : faChevronRight}
              />
              {topicCount} {t('chat.topics')}
            </button>
          </td>
          <td className={tdClass}>
            <Button
              className="text-xs font-semibold rounded-lg h-8 px-3"
              color="danger"
              isDisabled={isSaving}
              size="sm"
              variant="flat"
              onPress={() => removeSubject(si)}
            >
              {t('common.remove')}
            </Button>
          </td>
        </tr>
        {isExpanded && renderTopicsRow(subject, si)}
      </React.Fragment>
    );
  }

  function renderTopicsRow(subject: PublicExamSubject, si: number) {
    const topics = subject.topics ?? [];
    const isLast = si === draft.subjects.length - 1;

    return (
      <tr key={`topics-${si}`}>
        <td className={`px-4 pb-3 pt-0 ${isLast ? '' : 'border-b border-default-200'}`} colSpan={5}>
          <div className="flex flex-col gap-0.5 mb-2">
            {topics.map((topic, ti) => {
              const editKey = `${si}-${ti}`;
              const isEditingTopic = editingTopics[editKey] != null;
              const editValue = editingTopics[editKey] ?? '';

              if (isEditingTopic) {
                return (
                  <div
                    key={ti}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 bg-content1 border border-primary/40 shadow-sm"
                  >
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
                      className="bg-primary text-primary-foreground h-7 w-7 min-w-0 shrink-0"
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
                );
              }

              return (
                <div
                  key={ti}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-default-50 hover:bg-default-100 border border-transparent hover:border-default-200 transition-colors group"
                >
                  <span className="text-xs text-default-700 leading-relaxed flex-1">{topic.name}</span>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        aria-label={`Remove ${topic.name}`}
                        className="p-1 rounded text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
                        type="button"
                        onClick={() => removeTopic(si, ti)}
                      >
                        <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 items-center mt-1">
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
              className="bg-primary text-primary-foreground text-xs h-7 px-2"
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
