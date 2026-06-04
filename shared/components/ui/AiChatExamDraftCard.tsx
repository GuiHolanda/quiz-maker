'use client';
import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faTrash, faXmark, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PublicExam, PublicExamSubject } from '@/shared/types';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface AiChatExamDraftCardProps {
  readonly publicExam: PublicExam;
}

const TH = 'text-left text-xs font-semibold text-default-400 px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

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

  const [expandedSubjects, setExpandedSubjects] = useState<Record<number, boolean>>({});
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

      {isSaved ? renderSavedSummary() : renderEditForm()}
    </div>
  );

  function renderSavedSummary() {
    return (
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
    );
  }

  function renderEditForm() {
    return (
      <>
        <div className="space-y-3 mb-6">
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

        {renderSubjectsTable()}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={addSubject}
            isDisabled={isSaving}
            className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg"
            startContent={<FontAwesomeIcon icon={faPlus} className="w-3 h-3" />}
          >
            {t('chat.addSubject')}
          </Button>
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
    );
  }

  function renderSubjectsTable() {
    if (draft.subjects.length === 0) return null;
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-default-200 mb-4">
        <table className="w-full border-collapse">
          <thead className="bg-default-100">
            <tr>
              <th className={TH}>{t('chat.subjectName')}</th>
              <th className={TH}>{t('chat.minQuestions')}</th>
              <th className={TH}>{t('chat.maxQuestions')}</th>
              <th className={TH}>{t('chat.topics')}</th>
              <th className={TH}></th>
            </tr>
          </thead>
          <tbody>
            {draft.subjects.map((subject, si) => renderSubjectRow(subject, si))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderSubjectRow(subject: PublicExamSubject, si: number) {
    const isLast = si === draft.subjects.length - 1 && !expandedSubjects[si];
    const tdClass = isLast ? TD_LAST : TD;
    const rowBg = si % 2 === 0 ? 'bg-content1' : 'bg-default-50';
    const topicCount = (subject.topics ?? []).length;
    const isExpanded = !!expandedSubjects[si];

    return (
      <React.Fragment key={si}>
        <tr className={rowBg}>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              size="sm"
              value={subject.name}
              onValueChange={(v) => updateSubject(si, { name: v })}
              isDisabled={isSaving}
              className="w-44"
            />
          </td>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              size="sm"
              type="number"
              value={subject.minQuestions.toString()}
              onValueChange={(v) => updateSubject(si, { minQuestions: parseFloat(v) || 0 })}
              isDisabled={isSaving}
              className="w-20"
              endContent={<span className="text-xs text-default-400">%</span>}
            />
          </td>
          <td className={tdClass}>
            <Input
              {...inputProperties.input}
              size="sm"
              type="number"
              value={subject.maxQuestions.toString()}
              onValueChange={(v) => updateSubject(si, { maxQuestions: parseFloat(v) || 0 })}
              isDisabled={isSaving}
              className="w-20"
              endContent={<span className="text-xs text-default-400">%</span>}
            />
          </td>
          <td className={tdClass}>
            <button
              type="button"
              onClick={() => setExpandedSubjects(prev => ({ ...prev, [si]: !prev[si] }))}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-default-100 hover:bg-default-200 transition-colors text-xs text-default-600 font-medium"
            >
              <FontAwesomeIcon
                icon={isExpanded ? faChevronDown : faChevronRight}
                className="w-2.5 h-2.5 text-default-400"
              />
              {topicCount} {t('chat.topics')}
            </button>
          </td>
          <td className={tdClass}>
            <button
              type="button"
              onClick={() => removeSubject(si)}
              disabled={isSaving}
              className="text-default-300 hover:text-danger transition-colors disabled:opacity-40"
              aria-label={t('chat.removeSubject')}
            >
              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
            </button>
          </td>
        </tr>
        {isExpanded && renderSubjectTopicsRow(subject, si)}
      </React.Fragment>
    );
  }

  function renderSubjectTopicsRow(subject: PublicExamSubject, si: number) {
    const topics = subject.topics ?? [];
    const isLast = si === draft.subjects.length - 1;

    return (
      <tr key={`topics-${si}`}>
        <td
          colSpan={5}
          className={`px-4 pb-3 pt-0 ${isLast ? '' : 'border-b border-default-200'}`}
        >
          <div className="flex flex-col gap-0.5 mb-2">
            {topics.map((topic, ti) => (
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
        </td>
      </tr>
    );
  }
}
