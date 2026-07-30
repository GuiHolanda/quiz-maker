'use client';

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import { SectionRow } from './SectionRow';
import { AddSectionRow } from './AddSectionRow';

import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import { updateSection, deleteSection, addSection, addTopic, deleteTopic, updateTopic } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export interface ExamSectionsTableHandle {
  startAdd: () => void;
}

interface ExamSectionsTableProps {
  readonly selectedExam: Exam | null;
  readonly sectionsList?: ExamSection[];
  readonly editable?: boolean;
  // When true, renders the expandable topics column. Defaults to whether any
  // section already has topics (public_exam) — certifications can opt in too.
  readonly showTopics?: boolean;
  readonly onSectionChanged?: (sectionId: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
  readonly onSectionUpdated?: (sectionId: string, newName: string, minQuestions: number, maxQuestions: number) => void;
  readonly onSectionRemoved?: (sectionId: string) => void;
  readonly onSectionAdded?: (section: ExamSection) => void;
  readonly onTopicAdded?: (sectionId: string, topic: ExamTopic) => void;
  readonly onTopicRemoved?: (sectionId: string, topicId: string) => void;
  readonly onTopicUpdated?: (sectionId: string, topicId: string, newName: string) => void;
}

const TH = 'text-left text-xs font-medium text-default-400 px-4 py-3 border-b border-default-200';

export const ExamSectionsTable = forwardRef<ExamSectionsTableHandle, ExamSectionsTableProps>(function ExamSectionsTable(
  {
    selectedExam,
    sectionsList,
    editable = false,
    showTopics,
    onSectionChanged,
    onSectionUpdated,
    onSectionRemoved,
    onSectionAdded,
    onTopicAdded,
    onTopicRemoved,
    onTopicUpdated,
  },
  ref
) {
  const { t } = useTranslation();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);

  useImperativeHandle(ref, () => ({ startAdd: () => setIsAddingSection(true) }));

  const sections = selectedExam?.sections ?? sectionsList ?? [];
  const hasTopics = sections.some((s) => (s.topics?.length ?? 0) > 0);
  const topicsEnabled = showTopics ?? (hasTopics || Boolean(onTopicAdded));

  const persistSliderChange = useCallback(
    (sectionId: string, section: ExamSection, field: 'minQuestions' | 'maxQuestions', value: number) => {
      const timerKey = `${sectionId}-${field}`;

      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(async () => {
        try {
          await updateSection({
            sectionId,
            minQuestions: field === 'minQuestions' ? value : section.minQuestions,
            maxQuestions: field === 'maxQuestions' ? value : section.maxQuestions,
          });
        } catch {
          notify.error(t('toast.error'), t('toast.failedToUpdate', { name: section.name }));
        }
      }, 600);
    },
    [t]
  );

  const handleSliderChange = useCallback(
    (section: ExamSection, field: 'minQuestions' | 'maxQuestions', value: number) => {
      if (!section.id) return;
      onSectionChanged?.(section.id, field, value);
      persistSliderChange(section.id, section, field, value);
    },
    [onSectionChanged, persistSliderChange]
  );

  const handleUpdate = useCallback(
    async (section: ExamSection, newName: string, min: number, max: number) => {
      if (!section.id) return;
      await updateSection({ sectionId: section.id, newName, minQuestions: min, maxQuestions: max });
      onSectionUpdated?.(section.id, newName, min, max);
      notify.success(t('toast.success'), t('toast.sectionUpdated', { name: newName }));
    },
    [onSectionUpdated, t]
  );

  const handleRemove = useCallback(
    async (sectionId: string, sectionName: string) => {
      setRemovingId(sectionId);
      try {
        await deleteSection(sectionId);
        onSectionRemoved?.(sectionId);
        notify.success(t('toast.success'), t('toast.sectionRemoved', { name: sectionName }));
      } catch {
        notify.error(t('toast.error'), t('toast.failedToUpdate', { name: sectionName }));
      } finally {
        setRemovingId(null);
      }
    },
    [onSectionRemoved, t]
  );

  const handleAddSection = useCallback(
    async (name: string, min: number, max: number) => {
      if (!selectedExam?.id) return;
      const section = await addSection(selectedExam.id, name, min, max);

      onSectionAdded?.(section);
      setIsAddingSection(false);
      notify.success(t('toast.success'), t('toast.sectionAdded', { name }));
    },
    [selectedExam, onSectionAdded, t]
  );

  const handleAddTopic = useCallback(
    async (sectionId: string, name: string) => {
      const topic = await addTopic(sectionId, name);

      notify.success(t('toast.success'), t('toast.topicAdded', { name }));

      return topic;
    },
    [t]
  );

  const handleRemoveTopic = useCallback(
    async (sectionId: string, topicId: string, name: string) => {
      await deleteTopic(topicId);
      onTopicRemoved?.(sectionId, topicId);
      notify.success(t('toast.success'), t('toast.topicRemoved', { name }));
    },
    [onTopicRemoved, t]
  );

  const handleUpdateTopic = useCallback(
    async (sectionId: string, topicId: string, newName: string) => {
      await updateTopic(topicId, newName);
      onTopicUpdated?.(sectionId, topicId, newName);
      notify.success(t('toast.success'), t('toast.topicUpdated', { name: newName }));
    },
    [onTopicUpdated, t]
  );

  if (sections.length === 0 && !isAddingSection) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-default-400 text-center py-4">{t('exam.noSections')}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-default-200" data-testid="exam-sections-table">
      <table className="w-full border-collapse">
        <thead className="bg-content2">
          <tr>
            <th className={TH}>{t('exam.sectionName')}</th>
            <th className={TH}>{t('exam.minQuestionsHeader')}</th>
            <th className={TH}>{t('exam.maxQuestionsHeader')}</th>
            {topicsEnabled && <th className={TH}>{t('exam.topics')}</th>}
            <th className={TH}>{t('exam.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section, index) => (
            <SectionRow
              key={section.id ?? section.name}
              addTopic={onTopicAdded && section.id ? (name) => handleAddTopic(section.id!, name) : undefined}
              editable={editable}
              isLast={!isAddingSection && index === sections.length - 1}
              isRemoving={removingId === section.id}
              removeTopic={
                onTopicRemoved && section.id
                  ? (topicId, name) => handleRemoveTopic(section.id!, topicId, name)
                  : undefined
              }
              section={section}
              showTopics={topicsEnabled}
              updateTopic={(topicId, newName) => handleUpdateTopic(section.id!, topicId, newName)}
              onRemove={onSectionRemoved && section.id ? () => handleRemove(section.id!, section.name) : undefined}
              onSliderChange={editable ? (field, value) => handleSliderChange(section, field, value) : undefined}
              onTopicAdded={onTopicAdded && section.id ? (topic) => onTopicAdded(section.id!, topic) : undefined}
              onTopicRemoved={
                onTopicRemoved && section.id ? (topicId) => onTopicRemoved(section.id!, topicId) : undefined
              }
              onUpdate={onSectionUpdated ? (newName, min, max) => handleUpdate(section, newName, min, max) : undefined}
            />
          ))}
          {isAddingSection && (
            <AddSectionRow
              showTopicsColumn={topicsEnabled}
              onAdd={handleAddSection}
              onCancel={() => setIsAddingSection(false)}
            />
          )}
        </tbody>
      </table>
    </div>
  );
});
