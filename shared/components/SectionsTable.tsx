'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Slider } from '@heroui/slider';

import { Certification, CertificationTopic } from '@/shared/types';
import { updateCertificationTopic, deleteCertificationTopic, addCertificationTopic } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface SectionsTableProps {
  selectedCertification: Certification | null;
  topicsList?: CertificationTopic[];
  editable?: boolean;
  onTopicChanged?: (topicId: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
  onTopicUpdated?: (topicId: string, newName: string, minQuestions: number, maxQuestions: number) => void;
  onTopicRemoved?: (topicId: string) => void;
  onTopicAdded?: (topic: CertificationTopic) => void;
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

const TH = 'text-left text-xs font-medium text-default-400 px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

export function SectionsTable({
  selectedCertification,
  topicsList,
  editable = false,
  onTopicChanged,
  onTopicUpdated,
  onTopicRemoved,
  onTopicAdded,
}: SectionsTableProps) {
  const { t } = useTranslation();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', min: 0, max: 0 });
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [addState, setAddState] = useState<EditState>({ name: '', min: 0, max: 0 });
  const [adding, setAdding] = useState(false);
  const [addNameTouched, setAddNameTouched] = useState(false);

  const topics = selectedCertification?.topics ?? topicsList ?? [];

  const persistTopicChange = useCallback(
    (topicId: string, topic: CertificationTopic, field: 'minQuestions' | 'maxQuestions', value: number) => {
      const timerKey = `${topicId}-${field}`;

      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(async () => {
        try {
          await updateCertificationTopic({
            topicId,
            minQuestions: field === 'minQuestions' ? value : topic.minQuestions,
            maxQuestions: field === 'maxQuestions' ? value : topic.maxQuestions,
          });
        } catch {
          notify.error(t('toast.error'), t('toast.failedToUpdate', { name: topic.name }));
        }
      }, 600);
    },
    [t]
  );

  const handleSliderChange = useCallback(
    (entry: CertificationTopic, field: 'minQuestions' | 'maxQuestions', value: number) => {
      if (!entry.id) return;
      onTopicChanged?.(entry.id, field, value);
      persistTopicChange(entry.id, entry, field, value);
    },
    [onTopicChanged, persistTopicChange]
  );

  const startEdit = (topic: CertificationTopic) => {
    setEditingTopicId(topic.id ?? null);
    setEditState({ name: topic.name, min: topic.minQuestions, max: topic.maxQuestions });
  };

  const cancelEdit = () => setEditingTopicId(null);

  const saveEdit = async (topicId: string) => {
    setSaving(true);
    try {
      await updateCertificationTopic({
        topicId,
        newName: editState.name,
        minQuestions: editState.min,
        maxQuestions: editState.max,
      });
      onTopicUpdated?.(topicId, editState.name, editState.min, editState.max);
      setEditingTopicId(null);
      notify.success(t('toast.success'), t('toast.topicUpdated', { name: editState.name }));
    } catch {
      notify.error(t('toast.error'), t('toast.failedToUpdate', { name: editState.name }));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (topicId: string, topicName: string) => {
    setRemovingId(topicId);
    try {
      await deleteCertificationTopic(topicId);
      onTopicRemoved?.(topicId);
      notify.success(t('toast.success'), t('toast.topicRemoved', { name: topicName }));
    } catch {
      notify.error(t('toast.error'), t('toast.failedToUpdate', { name: topicName }));
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedCertification?.key || !addState.name.trim()) {
      setAddNameTouched(true);
      return;
    }
    setAdding(true);
    try {
      const topic = await addCertificationTopic(
        selectedCertification.key,
        addState.name.trim(),
        addState.min,
        addState.max
      );

      onTopicAdded?.(topic);
      setIsAddingTopic(false);
      setAddState({ name: '', min: 0, max: 0 });
      setAddNameTouched(false);
      notify.success(t('toast.success'), t('toast.topicAdded', { name: addState.name }));
    } catch {
      notify.error(t('toast.error'), t('toast.failedToUpdate', { name: addState.name }));
    } finally {
      setAdding(false);
    }
  };

  if (topics.length === 0 && !isAddingTopic) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-default-400 text-center py-4">{t('certification.noTopics')}</p>
        {onTopicAdded && (
          <Button className={buttonStyles.primarySm} size="sm" onPress={() => setIsAddingTopic(true)}>
            {t('certification.addTopic')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-default-200">
        <table className="w-full border-collapse">
          <thead className="bg-content2">
            <tr>
              <th className={TH}>{t('certification.topicName')}</th>
              <th className={TH}>{t('certification.minQuestionsHeader')}</th>
              <th className={TH}>{t('certification.maxQuestionsHeader')}</th>
              <th className={TH}>{t('certification.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic, index) => {
              const isEditing = editingTopicId !== null && editingTopicId === topic.id;
              const isLast = !isAddingTopic && index === topics.length - 1;
              const tdClass = isLast ? TD_LAST : TD;

              return (
                <tr key={topic.id ?? topic.name} className="bg-content1 hover:bg-content2 transition-colors duration-150">
                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        className="w-48"
                        size="sm"
                        value={editState.name}
                        onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      />
                    ) : (
                      topic.name
                    )}
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        className="w-24"
                        endContent={<span className="text-default-400 text-sm">%</span>}
                        max={100}
                        min={0}
                        size="sm"
                        type="number"
                        value={String(editState.min)}
                        onChange={(e) =>
                          setEditState((s) => ({ ...s, min: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      />
                    ) : editable && topic.id ? (
                      <Slider
                        showTooltip
                        aria-label="minQuestions"
                        className="w-36"
                        classNames={SLIDER_CLASS_NAMES}
                        maxValue={100}
                        minValue={0}
                        size="sm"
                        step={1}
                        value={topic.minQuestions}
                        onChange={(val) => handleSliderChange(topic, 'minQuestions', val as number)}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{`${Math.round(topic.minQuestions ?? 0)}%`}</span>
                        {topic.minQuestions === 0 && topic.maxQuestions === 0 && (
                          <span className="text-warning text-xs">⚠</span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <Input
                        {...inputProperties.input}
                        className="w-24"
                        endContent={<span className="text-default-400 text-sm">%</span>}
                        max={100}
                        min={0}
                        size="sm"
                        type="number"
                        value={String(editState.max)}
                        onChange={(e) =>
                          setEditState((s) => ({ ...s, max: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      />
                    ) : editable && topic.id ? (
                      <Slider
                        showTooltip
                        aria-label="maxQuestions"
                        className="w-36"
                        classNames={SLIDER_CLASS_NAMES}
                        maxValue={100}
                        minValue={0}
                        size="sm"
                        step={1}
                        value={topic.maxQuestions}
                        onChange={(val) => handleSliderChange(topic, 'maxQuestions', val as number)}
                      />
                    ) : (
                      `${Math.round(topic.maxQuestions ?? 0)}%`
                    )}
                  </td>

                  <td className={tdClass}>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          className={buttonStyles.primarySm}
                          isLoading={saving}
                          size="sm"
                          onPress={() => saveEdit(topic.id!)}
                        >
                          {t('common.save')}
                        </Button>
                        <Button
                          className={buttonStyles.secondary}
                          size="sm"
                          variant="bordered"
                          onPress={cancelEdit}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {onTopicUpdated && topic.id && (
                          <Button
                            className={buttonStyles.flat}
                            size="sm"
                            variant="flat"
                            onPress={() => startEdit(topic)}
                          >
                            {t('common.edit')}
                          </Button>
                        )}
                        {onTopicRemoved && topic.id && (
                          <Button
                            className={buttonStyles.dangerFlat}
                            isLoading={removingId === topic.id}
                            size="sm"
                            onPress={() => handleRemove(topic.id!, topic.name)}
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
            {isAddingTopic && (
              <tr className="bg-content1">
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    className="w-48"
                    errorMessage={addNameTouched && !addState.name.trim() ? t('error.nameRequired') : undefined}
                    isInvalid={addNameTouched && !addState.name.trim()}
                    placeholder={t('certification.topicNamePlaceholder')}
                    size="sm"
                    value={addState.name}
                    onChange={(e) => setAddState((s) => ({ ...s, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    className="w-24"
                    endContent={<span className="text-default-400 text-sm">%</span>}
                    max={100}
                    min={0}
                    size="sm"
                    type="number"
                    value={String(addState.min)}
                    onChange={(e) =>
                      setAddState((s) => ({ ...s, min: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className={TD_LAST}>
                  <Input
                    {...inputProperties.input}
                    className="w-24"
                    endContent={<span className="text-default-400 text-sm">%</span>}
                    max={100}
                    min={0}
                    size="sm"
                    type="number"
                    value={String(addState.max)}
                    onChange={(e) =>
                      setAddState((s) => ({ ...s, max: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className={TD_LAST}>
                  <div className="flex gap-2">
                    <Button
                      className={buttonStyles.primarySm}
                      isLoading={adding}
                      size="sm"
                      onPress={handleAdd}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      className={buttonStyles.secondary}
                      size="sm"
                      variant="bordered"
                      onPress={() => {
                        setIsAddingTopic(false);
                        setAddState({ name: '', min: 0, max: 0 });
                        setAddNameTouched(false);
                      }}
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
      {!isAddingTopic && onTopicAdded && (
        <div className="mt-4 flex">
          <Button className={buttonStyles.primarySm} size="sm" onPress={() => setIsAddingTopic(true)}>
            {t('certification.addTopic')}
          </Button>
        </div>
      )}
    </>
  );
}
