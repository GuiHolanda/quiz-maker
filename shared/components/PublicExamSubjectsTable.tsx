'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@heroui/button';

import { SubjectRow } from './PublicExamSubjectsTable/SubjectRow';
import { AddSubjectRow } from './PublicExamSubjectsTable/AddSubjectRow';

import { PublicExam, PublicExamSubject, PublicExamTopic } from '@/shared/types';
import {
  updatePublicExamSubject,
  deletePublicExamSubject,
  addPublicExamSubject,
  addPublicExamTopic,
  deletePublicExamTopic,
  updatePublicExamTopic,
} from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface PublicExamSubjectsTableProps {
  readonly selectedPublicExam: PublicExam | null;
  readonly subjectsList?: PublicExamSubject[];
  readonly editable?: boolean;
  readonly onSubjectChanged?: (subjectId: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
  readonly onSubjectUpdated?: (subjectId: string, newName: string, minQuestions: number, maxQuestions: number) => void;
  readonly onSubjectRemoved?: (subjectId: string) => void;
  readonly onSubjectAdded?: (subject: PublicExamSubject) => void;
  readonly onTopicAdded?: (subjectId: string, topic: PublicExamTopic) => void;
  readonly onTopicRemoved?: (subjectId: string, topicId: string) => void;
  readonly onTopicUpdated?: (subjectId: string, topicId: string, newName: string) => void;
  readonly onEditPublicExam?: () => void;
  readonly onDeletePublicExam?: () => void;
}

const TH = 'text-left text-xs font-semibold text-default-400 px-4 py-3 border-b border-default-200';

export function PublicExamSubjectsTable({
  selectedPublicExam,
  subjectsList,
  editable = false,
  onSubjectChanged,
  onSubjectUpdated,
  onSubjectRemoved,
  onSubjectAdded,
  onTopicAdded,
  onTopicRemoved,
  onTopicUpdated,
  onEditPublicExam,
  onDeletePublicExam,
}: PublicExamSubjectsTableProps) {
  const { t } = useTranslation();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const subjects = selectedPublicExam?.subjects ?? subjectsList ?? [];

  const persistSliderChange = useCallback(
    (subjectId: string, subject: PublicExamSubject, field: 'minQuestions' | 'maxQuestions', value: number) => {
      const timerKey = `${subjectId}-${field}`;

      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(async () => {
        try {
          await updatePublicExamSubject({
            subjectId,
            minQuestions: field === 'minQuestions' ? value : subject.minQuestions,
            maxQuestions: field === 'maxQuestions' ? value : subject.maxQuestions,
          });
        } catch {
          notify.error(t('toast.error'), t('toast.failedToUpdate', { name: subject.name }));
        }
      }, 600);
    },
    [t]
  );

  const handleSliderChange = useCallback(
    (subject: PublicExamSubject, field: 'minQuestions' | 'maxQuestions', value: number) => {
      if (!subject.id) return;
      onSubjectChanged?.(subject.id, field, value);
      persistSliderChange(subject.id, subject, field, value);
    },
    [onSubjectChanged, persistSliderChange]
  );

  const handleUpdate = useCallback(
    async (subject: PublicExamSubject, newName: string, min: number, max: number) => {
      if (!subject.id) return;
      await updatePublicExamSubject({ subjectId: subject.id, newName, minQuestions: min, maxQuestions: max });
      onSubjectUpdated?.(subject.id, newName, min, max);
      notify.success(t('toast.success'), t('toast.subjectUpdated', { name: newName }));
    },
    [onSubjectUpdated, t]
  );

  const handleRemove = useCallback(
    async (subjectId: string, subjectName: string) => {
      setRemovingId(subjectId);
      try {
        await deletePublicExamSubject(subjectId);
        onSubjectRemoved?.(subjectId);
        notify.success(t('toast.success'), t('toast.subjectRemoved', { name: subjectName }));
      } catch {
        notify.error(t('toast.error'), t('toast.failedToUpdate', { name: subjectName }));
      } finally {
        setRemovingId(null);
      }
    },
    [onSubjectRemoved, t]
  );

  const handleAddSubject = useCallback(
    async (name: string, min: number, max: number) => {
      if (!selectedPublicExam?.id) return;
      const subject = await addPublicExamSubject(selectedPublicExam.id, name, min, max);

      onSubjectAdded?.(subject);
      setIsAddingSubject(false);
      notify.success(t('toast.success'), t('toast.subjectAdded', { name }));
    },
    [selectedPublicExam, onSubjectAdded, t]
  );

  const handleAddTopic = useCallback(
    async (subjectId: string, name: string) => {
      const topic = await addPublicExamTopic(subjectId, name);

      notify.success(t('toast.success'), t('toast.topicAdded', { name }));

      return topic;
    },
    [t]
  );

  const handleRemoveTopic = useCallback(
    async (subjectId: string, topicId: string, name: string) => {
      await deletePublicExamTopic(topicId);
      onTopicRemoved?.(subjectId, topicId);
      notify.success(t('toast.success'), t('toast.topicRemoved', { name }));
    },
    [onTopicRemoved, t]
  );

  const handleUpdateTopic = useCallback(
    async (subjectId: string, topicId: string, newName: string) => {
      await updatePublicExamTopic(topicId, newName);
      onTopicUpdated?.(subjectId, topicId, newName);
      notify.success(t('toast.success'), t('toast.topicUpdated', { name: newName }));
    },
    [onTopicUpdated, t]
  );

  if (subjects.length === 0 && !isAddingSubject) {
    return renderEmpty();
  }

  return renderTable();

  function renderEmpty() {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-default-400 text-center py-4">{t('concurso.noSubjects')}</p>
        {(onSubjectAdded || onEditPublicExam) && (
          <div className="flex gap-2">
            {onEditPublicExam && renderEditExamButton()}
            {onSubjectAdded && renderAddSubjectButton()}
          </div>
        )}
      </div>
    );
  }

  function renderTable() {
    return (
      <>
        <div className="w-full overflow-x-auto rounded-xl border border-default-200">
          <table className="w-full border-collapse">
            <thead className="bg-default-100">
              <tr>
                <th className={TH}>{t('concurso.subjectName')}</th>
                <th className={TH}>{t('concurso.minQuestions')}</th>
                <th className={TH}>{t('concurso.maxQuestions')}</th>
                <th className={TH}>{t('concurso.topics')}</th>
                <th className={TH}>{t('concurso.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => renderSubjectRow(subject, index))}
              {isAddingSubject && <AddSubjectRow onAdd={handleAddSubject} onCancel={() => setIsAddingSubject(false)} />}
            </tbody>
          </table>
        </div>
        {renderTableFooter()}
      </>
    );
  }

  function renderSubjectRow(subject: PublicExamSubject, index: number) {
    return (
      <SubjectRow
        key={subject.id ?? subject.name}
        addTopic={onTopicAdded && subject.id ? (name) => handleAddTopic(subject.id!, name) : undefined}
        editable={editable}
        index={index}
        isLast={!isAddingSubject && index === subjects.length - 1}
        isRemoving={removingId === subject.id}
        removeTopic={
          onTopicRemoved && subject.id ? (topicId, name) => handleRemoveTopic(subject.id!, topicId, name) : undefined
        }
        subject={subject}
        updateTopic={(topicId, newName) => handleUpdateTopic(subject.id!, topicId, newName)}
        onRemove={onSubjectRemoved && subject.id ? () => handleRemove(subject.id!, subject.name) : undefined}
        onSliderChange={editable ? (field, value) => handleSliderChange(subject, field, value) : undefined}
        onTopicAdded={onTopicAdded && subject.id ? (topic) => onTopicAdded(subject.id!, topic) : undefined}
        onTopicRemoved={onTopicRemoved && subject.id ? (topicId) => onTopicRemoved(subject.id!, topicId) : undefined}
        onUpdate={onSubjectUpdated ? (newName, min, max) => handleUpdate(subject, newName, min, max) : undefined}
      />
    );
  }

  function renderTableFooter() {
    if (isAddingSubject || (!onSubjectAdded && !onEditPublicExam && !onDeletePublicExam)) return null;

    return (
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {onEditPublicExam && renderEditExamButton()}
          {!isAddingSubject && onSubjectAdded && renderAddSubjectButton()}
        </div>
        {onDeletePublicExam && (
          <Button
            className={buttonStyles.danger}
            size="sm"
            onPress={onDeletePublicExam}
          >
            {t('concurso.deleteExamTitle')}
          </Button>
        )}
      </div>
    );
  }

  function renderEditExamButton() {
    return (
      <Button
        className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
        size="sm"
        variant="flat"
        onPress={onEditPublicExam}
      >
        {t('concurso.editPublicExam')}
      </Button>
    );
  }

  function renderAddSubjectButton() {
    return (
      <Button
        className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
        size="sm"
        variant="flat"
        onPress={() => setIsAddingSubject(true)}
      >
        {t('concurso.addSubject')}
      </Button>
    );
  }
}
