'use client';
import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPen, faCheck, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { PublicExamSubject, PublicExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const TH =
  'text-left font-mono text-[10px] text-default-400 uppercase tracking-widest px-3 py-2.5 border-b border-default-200';
const TD_S = 'px-3 py-2 border-b border-default-200';
const TD_S_LAST = 'px-3 py-2';
const TD_T = 'px-3 py-1.5 border-b border-default-100';
const TD_T_LAST = 'px-3 py-1.5';

interface ExamDistributionTableProps {
  readonly subjects: PublicExamSubject[];
  readonly isSaving: boolean;
  readonly onUpdateSubject: (index: number, patch: Partial<PublicExamSubject>) => void;
  readonly onRemoveSubject: (index: number) => void;
  readonly onAddTopic: (subjectIndex: number, name: string) => void;
  readonly onRemoveTopic: (subjectIndex: number, topicIndex: number) => void;
  readonly onUpdateTopic: (subjectIndex: number, topicIndex: number, newName: string) => void;
}

export function ExamDistributionTable({
  subjects,
  isSaving,
  onUpdateSubject,
  onRemoveSubject,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
}: ExamDistributionTableProps) {
  const { t } = useTranslation();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<number, boolean>>({});
  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});
  const [editingTopics, setEditingTopics] = useState<Record<string, string | null>>({});
  const [confirmRemoveSubject, setConfirmRemoveSubject] = useState<number | null>(null);

  if (subjects.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-default-500 uppercase tracking-wide mb-3">{t('chat.subjects')}</p>
      <div className="w-full rounded-xl border border-default-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-content2">
            <tr>
              <th className={TH}>{t('chat.subjectName')}</th>
              <th className={`${TH} w-28`}>{t('chat.minQuestions')}</th>
              <th className={`${TH} w-28`}>{t('chat.maxQuestions')}</th>
              <th className={`${TH} w-10`} />
            </tr>
          </thead>
          <tbody>{subjects.map((subject, si) => renderSubjectRow(subject, si))}</tbody>
        </table>
      </div>
    </div>
  );

  function renderSubjectRow(subject: PublicExamSubject, si: number) {
    const isExpanded = !!expandedSubjects[si];
    const isLastSubject = si === subjects.length - 1;
    const hasTopics = (subject.topics ?? []).length > 0;
    const tdSubject = isLastSubject && !isExpanded ? TD_S_LAST : TD_S;

    return (
      <React.Fragment key={si}>
        {renderSubjectHeaderRow(subject, si, isExpanded, tdSubject, hasTopics)}
        {isExpanded &&
          (subject.topics ?? []).map((topic, ti) =>
            renderTopicRow(
              topic,
              si,
              ti,
              isLastSubject && ti === (subject.topics ?? []).length - 1 && !hasTopics
            )
          )}
        {isExpanded && renderAddTopicRow(si, isLastSubject)}
      </React.Fragment>
    );
  }

  function renderSubjectHeaderRow(
    subject: PublicExamSubject,
    si: number,
    isExpanded: boolean,
    tdClass: string,
    hasTopics: boolean
  ) {
    const topicCount = (subject.topics ?? []).length;

    return (
      <tr key={`subject-${si}`} className="bg-content2">
        <td className={tdClass}>
          <div className="flex items-center gap-2">
            <button
              aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-default-400 hover:text-primary hover:bg-default-100 transition-colors"
              type="button"
              onClick={() => setExpandedSubjects((prev) => ({ ...prev, [si]: !prev[si] }))}
            >
              <FontAwesomeIcon className="w-2.5 h-2.5" icon={isExpanded ? faChevronDown : faChevronRight} />
            </button>
            <Input
              {...inputProperties.input}
              aria-label={t('chat.subjectName')}
              className="min-w-0 flex-1"
              isDisabled={isSaving}
              size="sm"
              value={subject.name}
              onValueChange={(v) => onUpdateSubject(si, { name: v })}
            />
            {!isExpanded && topicCount > 0 && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-default-100 text-default-500 whitespace-nowrap">
                {topicCount} {t('chat.topics')}
              </span>
            )}
            {isExpanded && hasTopics && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary whitespace-nowrap">
                {topicCount} {t('chat.topics')}
              </span>
            )}
          </div>
        </td>
        <td className={tdClass}>
          <Input
            {...inputProperties.input}
            aria-label={t('chat.minQuestions')}
            className="w-20"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={subject.minQuestions.toString()}
            onValueChange={(v) => onUpdateSubject(si, { minQuestions: parseFloat(v) || 0 })}
          />
        </td>
        <td className={tdClass}>
          <Input
            {...inputProperties.input}
            aria-label={t('chat.maxQuestions')}
            className="w-20"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={subject.maxQuestions.toString()}
            onValueChange={(v) => onUpdateSubject(si, { maxQuestions: parseFloat(v) || 0 })}
          />
        </td>
        <td className={tdClass}>
          <Popover
            isOpen={confirmRemoveSubject === si}
            placement="left"
            onOpenChange={(open) => setConfirmRemoveSubject(open ? si : null)}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                aria-label={t('common.remove')}
                className={buttonStyles.iconOnly.danger}
                isDisabled={isSaving}
                size="sm"
                variant="light"
              >
                <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
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
                      onRemoveSubject(si);
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

  function renderTopicRow(topic: PublicExamTopic, si: number, ti: number, isActuallyLast: boolean) {
    const editKey = `${si}-${ti}`;
    const isEditingTopic = editingTopics[editKey] != null;
    const editValue = editingTopics[editKey] ?? '';
    const tdClass = isActuallyLast ? TD_T_LAST : TD_T;

    if (isEditingTopic) {
      return (
        <tr key={`topic-edit-${si}-${ti}`} className="bg-content1">
          <td className={tdClass} colSpan={4}>
            <div className="flex items-center gap-1.5 pl-7">
              <Input
                {...inputProperties.input}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="flex-1"
                size="sm"
                value={editValue}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editValue.trim()) {
                    onUpdateTopic(si, ti, editValue);
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
                className={`${buttonStyles.iconOnly.primary} h-6 w-6 min-w-0 shrink-0`}
                isDisabled={!editValue.trim()}
                size="sm"
                onPress={() => {
                  if (editValue.trim()) {
                    onUpdateTopic(si, ti, editValue);
                    setEditingTopics((prev) => ({ ...prev, [editKey]: null }));
                  }
                }}
              >
                <FontAwesomeIcon className="w-2.5 h-2.5" icon={faCheck} />
              </Button>
              <button
                aria-label={t('common.cancel')}
                className="p-1 rounded text-default-400 hover:text-danger transition-colors shrink-0"
                type="button"
                onClick={() => setEditingTopics((prev) => ({ ...prev, [editKey]: null }))}
              >
                <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={`topic-${si}-${ti}`} className="bg-content1 group">
        <td className={TD_T} colSpan={4}>
          <div className="flex items-center justify-between gap-2 pl-8 py-0.5">
            <span className="text-xs text-default-700 leading-relaxed break-words min-w-0">{topic.name}</span>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              {!isSaving && (
                <button
                  aria-label={t('common.edit')}
                  className="p-1 rounded text-default-400 hover:text-primary hover:bg-default-100 transition-colors"
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
                  onClick={() => onRemoveTopic(si, ti)}
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
    const tdClass = isLastSubject ? TD_S_LAST : TD_S;

    return (
      <tr key={`add-topic-${si}`} className="bg-content1">
        <td className={tdClass} colSpan={4}>
          <div className="flex gap-1.5 items-center pl-7">
            <Input
              {...inputProperties.input}
              className="w-52"
              isDisabled={isSaving}
              placeholder={t('chat.addTopic')}
              size="sm"
              value={newTopicInputs[si] ?? ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTopicInputs[si]?.trim()) {
                  onAddTopic(si, newTopicInputs[si]);
                  setNewTopicInputs((prev) => ({ ...prev, [si]: '' }));
                }
              }}
              onValueChange={(v) => setNewTopicInputs((prev) => ({ ...prev, [si]: v }))}
            />
            <Button
              className={`${buttonStyles.primarySm} h-7 px-3`}
              isDisabled={isSaving || !newTopicInputs[si]?.trim()}
              size="sm"
              onPress={() => {
                if (newTopicInputs[si]?.trim()) {
                  onAddTopic(si, newTopicInputs[si]);
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
