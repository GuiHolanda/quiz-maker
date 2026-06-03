'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Slider } from '@heroui/slider';
import { addToast } from '@heroui/toast';

import { PublicExam, PublicExamSubject, PublicExamTopic } from '@/shared/types';
import {
  updatePublicExamSubject,
  deletePublicExamSubject,
  addPublicExamSubject,
  addPublicExamTopic,
  deletePublicExamTopic,
} from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface PublicExamSubjectsTableProps {
  selectedPublicExam: PublicExam | null;
  subjectsList?: PublicExamSubject[];
  editable?: boolean;
  onSubjectChanged?: (subjectId: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
  onSubjectUpdated?: (subjectId: string, newName: string, minQuestions: number, maxQuestions: number) => void;
  onSubjectRemoved?: (subjectId: string) => void;
  onSubjectAdded?: (subject: PublicExamSubject) => void;
  onTopicAdded?: (subjectId: string, topic: PublicExamTopic) => void;
  onTopicRemoved?: (subjectId: string, topicId: string) => void;
  onEditPublicExam?: () => void;
}

interface EditState {
  name: string;
  min: number;
  max: number;
}

const SLIDER_CLASS_NAMES = {
  label: 'text-xs text-default-500 font-bold',
  value: 'text-xs font-bold',
  labelWrapper: 'flex flex-col items-start',
  thumb: 'h-3 w-4',
};

const TH = 'text-left text-xs font-semibold text-default-400 px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

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
  onEditPublicExam,
}: PublicExamSubjectsTableProps) {
  const { t } = useTranslation();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', min: 0, max: 0 });
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [addState, setAddState] = useState<EditState>({ name: '', min: 0, max: 0 });
  const [adding, setAdding] = useState(false);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicSaving, setTopicSaving] = useState(false);

  const subjects = selectedPublicExam?.subjects ?? subjectsList ?? [];

  const persistSubjectChange = useCallback(
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
          addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: subject.name }), color: 'danger' });
        }
      }, 600);
    },
    [t],
  );

  const handleSliderChange = useCallback(
    (entry: PublicExamSubject, field: 'minQuestions' | 'maxQuestions', value: number) => {
      if (!entry.id) return;
      onSubjectChanged?.(entry.id, field, value);
      persistSubjectChange(entry.id, entry, field, value);
    },
    [onSubjectChanged, persistSubjectChange],
  );

  const startEdit = (subject: PublicExamSubject) => {
    setEditingSubjectId(subject.id ?? null);
    setEditState({ name: subject.name, min: subject.minQuestions, max: subject.maxQuestions });
  };

  const cancelEdit = () => setEditingSubjectId(null);

  const saveEdit = async (subjectId: string) => {
    setSaving(true);
    try {
      await updatePublicExamSubject({
        subjectId,
        newName: editState.name,
        minQuestions: editState.min,
        maxQuestions: editState.max,
      });
      onSubjectUpdated?.(subjectId, editState.name, editState.min, editState.max);
      setEditingSubjectId(null);
      addToast({ title: t('toast.success'), description: t('toast.subjectUpdated', { name: editState.name }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: editState.name }), color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (subjectId: string, subjectName: string) => {
    setRemovingId(subjectId);
    try {
      await deletePublicExamSubject(subjectId);
      onSubjectRemoved?.(subjectId);
      addToast({ title: t('toast.success'), description: t('toast.subjectRemoved', { name: subjectName }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: subjectName }), color: 'danger' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedPublicExam?.id || !addState.name.trim()) return;
    setAdding(true);
    try {
      const subject = await addPublicExamSubject(
        selectedPublicExam.id,
        addState.name.trim(),
        addState.min,
        addState.max,
      );
      onSubjectAdded?.(subject);
      setIsAddingSubject(false);
      setAddState({ name: '', min: 0, max: 0 });
      addToast({ title: t('toast.success'), description: t('toast.subjectAdded', { name: addState.name }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: addState.name }), color: 'danger' });
    } finally {
      setAdding(false);
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    if (!topicName.trim()) return;
    setTopicSaving(true);
    try {
      const topic = await addPublicExamTopic(subjectId, topicName.trim());
      onTopicAdded?.(subjectId, topic);
      addToast({ title: t('toast.success'), description: t('toast.topicAdded', { name: topicName }), color: 'success' });
      setTopicName('');
      setAddingTopicTo(null);
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: topicName }), color: 'danger' });
    } finally {
      setTopicSaving(false);
    }
  };

  const handleRemoveTopic = async (subjectId: string, topicId: string, name: string) => {
    try {
      await deletePublicExamTopic(topicId);
      onTopicRemoved?.(subjectId, topicId);
      addToast({ title: t('toast.success'), description: t('toast.topicRemoved', { name }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name }), color: 'danger' });
    }
  };

  if (subjects.length === 0 && !isAddingSubject) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-default-400 text-center py-4">{t('concurso.noSubjects')}</p>
        {(onSubjectAdded || onEditPublicExam) && (
          <div className="flex gap-2">
            {onEditPublicExam && (
              <Button
                size="sm"
                variant="flat"
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                onPress={onEditPublicExam}
              >
                {t('concurso.editPublicExam')}
              </Button>
            )}
            {onSubjectAdded && (
              <Button
                size="sm"
                variant="flat"
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                onPress={() => setIsAddingSubject(true)}
              >
                {t('concurso.addSubject')}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

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
            {subjects.map((subject, index) => {
              const isEditing = editingSubjectId !== null && editingSubjectId === subject.id;
              const isLast = !isAddingSubject && index === subjects.length - 1;
              const tdClass = isLast ? TD_LAST : TD;

              return (
                <tr key={subject.id ?? subject.name} className={index % 2 === 0 ? 'bg-content1' : 'bg-default-50'}>
                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        size="sm"
                        value={editState.name}
                        onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(subject.id!)}
                        className="w-48"
                      />
                    ) : (
                      subject.name
                    )}
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        size="sm"
                        type="number"
                        min={0}
                        max={100}
                        value={String(editState.min)}
                        onChange={(e) => setEditState((s) => ({ ...s, min: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(subject.id!)}
                        className="w-24"
                        endContent={<span className="text-default-400 text-sm">%</span>}
                      />
                    ) : editable && subject.id ? (
                      <Slider
                        className="w-36"
                        classNames={SLIDER_CLASS_NAMES}
                        size="sm"
                        value={subject.minQuestions}
                        maxValue={100}
                        minValue={0}
                        showTooltip
                        step={1}
                        aria-label="minQuestions"
                        onChange={(val) => handleSliderChange(subject, 'minQuestions', val as number)}
                      />
                    ) : (
                      `${subject.minQuestions}%`
                    )}
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        size="sm"
                        type="number"
                        min={0}
                        max={100}
                        value={String(editState.max)}
                        onChange={(e) => setEditState((s) => ({ ...s, max: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(subject.id!)}
                        className="w-24"
                        endContent={<span className="text-default-400 text-sm">%</span>}
                      />
                    ) : editable && subject.id ? (
                      <Slider
                        className="w-36"
                        classNames={SLIDER_CLASS_NAMES}
                        size="sm"
                        value={subject.maxQuestions}
                        maxValue={100}
                        minValue={0}
                        showTooltip
                        step={1}
                        aria-label="maxQuestions"
                        onChange={(val) => handleSliderChange(subject, 'maxQuestions', val as number)}
                      />
                    ) : (
                      `${subject.maxQuestions}%`
                    )}
                  </td>

                  <td className={tdClass}>
                    <div className="flex flex-col gap-1">
                      {(subject.topics ?? []).map((topic) => (
                        <div key={topic.id ?? topic.name} className="flex items-center gap-2">
                          <span className="text-xs">{topic.name}</span>
                          {onTopicRemoved && topic.id && (
                            <button
                              type="button"
                              className="text-xs text-danger hover:opacity-80"
                              onClick={() => handleRemoveTopic(subject.id!, topic.id!, topic.name)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {addingTopicTo === subject.id ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            {...inputProperties.input}
                            size="sm"
                            placeholder={t('concurso.topicNamePlaceholder')}
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id!)}
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground text-xs h-7 px-2"
                            isLoading={topicSaving}
                            onPress={() => handleAddTopic(subject.id!)}
                          >
                            {t('common.save')}
                          </Button>
                        </div>
                      ) : (
                        onTopicAdded && subject.id && (
                          <button
                            type="button"
                            className="text-xs text-primary self-start hover:opacity-80"
                            onClick={() => { setAddingTopicTo(subject.id!); setTopicName(''); }}
                          >
                            + {t('concurso.addTopic')}
                          </button>
                        )
                      )}
                    </div>
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-3 transition-opacity duration-200"
                          isLoading={saving}
                          onPress={() => saveEdit(subject.id!)}
                        >
                          {t('common.save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold h-8 px-3 transition-colors duration-200"
                          onPress={cancelEdit}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {onSubjectUpdated && subject.id && (
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                            onPress={() => startEdit(subject)}
                          >
                            {t('common.edit')}
                          </Button>
                        )}
                        {onSubjectRemoved && subject.id && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            className="text-xs font-semibold rounded-lg h-8 px-3"
                            isLoading={removingId === subject.id}
                            onPress={() => handleRemove(subject.id!, subject.name)}
                          >
                            {t('common.remove')}
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {isAddingSubject && (
              <tr className="bg-content1">
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    size="sm"
                    placeholder={t('concurso.subjectNamePlaceholder')}
                    value={addState.name}
                    onChange={(e) => setAddState((s) => ({ ...s, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="w-48"
                  />
                </td>
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    size="sm"
                    type="number"
                    min={0}
                    max={100}
                    value={String(addState.min)}
                    onChange={(e) => setAddState((s) => ({ ...s, min: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="w-24"
                    endContent={<span className="text-default-400 text-sm">%</span>}
                  />
                </td>
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    size="sm"
                    type="number"
                    min={0}
                    max={100}
                    value={String(addState.max)}
                    onChange={(e) => setAddState((s) => ({ ...s, max: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="w-24"
                    endContent={<span className="text-default-400 text-sm">%</span>}
                  />
                </td>
                <td className={TD_LAST}>—</td>
                <td className={TD_LAST}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-3 transition-opacity duration-200"
                      isLoading={adding}
                      onPress={handleAdd}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold h-8 px-3 transition-colors duration-200"
                      onPress={() => { setIsAddingSubject(false); setAddState({ name: '', min: 0, max: 0 }); }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(!isAddingSubject && onSubjectAdded) || onEditPublicExam ? (
        <div className="mt-3 flex gap-2">
          {onEditPublicExam && (
            <Button
              size="sm"
              variant="flat"
              className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
              onPress={onEditPublicExam}
            >
              {t('concurso.editPublicExam')}
            </Button>
          )}
          {!isAddingSubject && onSubjectAdded && (
            <Button
              size="sm"
              variant="flat"
              className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
              onPress={() => setIsAddingSubject(true)}
            >
              {t('concurso.addSubject')}
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
}
