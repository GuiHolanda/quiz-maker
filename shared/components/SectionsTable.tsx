'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Slider } from '@heroui/slider';
import { addToast } from '@heroui/toast';

import { Certification, CertificationTopic } from '@/shared/types';
import { updateCertificationTopic, deleteCertificationTopic, addCertificationTopic } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface SectionsTableProps {
  selectedCertification: Certification | null;
  topicsList?: CertificationTopic[];
  editable?: boolean;
  onTopicChanged?: (topicId: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
  onTopicUpdated?: (topicId: string, newName: string, minQuestions: number, maxQuestions: number) => void;
  onTopicRemoved?: (topicId: string) => void;
  onTopicAdded?: (topic: CertificationTopic) => void;
  onEditCertification?: () => void;
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

export function SectionsTable({
  selectedCertification,
  topicsList,
  editable = false,
  onTopicChanged,
  onTopicUpdated,
  onTopicRemoved,
  onTopicAdded,
  onEditCertification,
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
          addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: topic.name }), color: 'danger' });
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
      addToast({ title: t('toast.success'), description: t('toast.topicUpdated', { name: editState.name }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: editState.name }), color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (topicId: string, topicName: string) => {
    setRemovingId(topicId);
    try {
      await deleteCertificationTopic(topicId);
      onTopicRemoved?.(topicId);
      addToast({ title: t('toast.success'), description: t('toast.topicRemoved', { name: topicName }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: topicName }), color: 'danger' });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedCertification?.key || !addState.name.trim()) return;
    setAdding(true);
    try {
      const topic = await addCertificationTopic(selectedCertification.key, addState.name.trim(), addState.min, addState.max);
      onTopicAdded?.(topic);
      setIsAddingTopic(false);
      setAddState({ name: '', min: 0, max: 0 });
      addToast({ title: t('toast.success'), description: t('toast.topicAdded', { name: addState.name }), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: addState.name }), color: 'danger' });
    } finally {
      setAdding(false);
    }
  };

  if (topics.length === 0 && !isAddingTopic) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-default-400 text-center py-4">{t('certification.noTopics')}</p>
        {(onTopicAdded || onEditCertification) && (
          <div className="flex gap-2">
            {onEditCertification && (
              <Button
                size="sm"
                variant="flat"
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                onPress={onEditCertification}
              >
                {t('certification.editCertification')}
              </Button>
            )}
            {onTopicAdded && (
              <Button
                size="sm"
                variant="flat"
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                onPress={() => setIsAddingTopic(true)}
              >
                {t('certification.addTopic')}
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
            <th className={TH}>{t('certification.topicName')}</th>
            <th className={TH}>{t('certification.minQuestions')}</th>
            <th className={TH}>{t('certification.maxQuestions')}</th>
            <th className={TH}>{t('certification.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic, index) => {
            const isEditing = editingTopicId !== null && editingTopicId === topic.id;
            const isLast = !isAddingTopic && index === topics.length - 1;
            const tdClass = isLast ? TD_LAST : TD;

            return (
              <tr key={topic.id ?? topic.name} className={index % 2 === 0 ? 'bg-content1' : 'bg-default-50'}>
                <td className={tdClass}>
                  {isEditing ? (
                    <Input
                      {...inputProperties.input}
                      size="sm"
                      value={editState.name}
                      onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      className="w-48"
                    />
                  ) : (
                    topic.name
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
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      className="w-24"
                      endContent={<span className="text-default-400 text-sm">%</span>}
                    />
                  ) : editable && topic.id ? (
                    <Slider
                      className="w-36"
                      classNames={SLIDER_CLASS_NAMES}
                      size="sm"
                      value={topic.minQuestions}
                      maxValue={100}
                      minValue={0}
                      showTooltip
                      step={1}
                      aria-label="minQuestions"
                      onChange={(val) => handleSliderChange(topic, 'minQuestions', val as number)}
                    />
                  ) : (
                    `${topic.minQuestions}%`
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
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(topic.id!)}
                      className="w-24"
                      endContent={<span className="text-default-400 text-sm">%</span>}
                    />
                  ) : editable && topic.id ? (
                    <Slider
                      className="w-36"
                      classNames={SLIDER_CLASS_NAMES}
                      size="sm"
                      value={topic.maxQuestions}
                      maxValue={100}
                      minValue={0}
                      showTooltip
                      step={1}
                      aria-label="maxQuestions"
                      onChange={(val) => handleSliderChange(topic, 'maxQuestions', val as number)}
                    />
                  ) : (
                    `${topic.maxQuestions}%`
                  )}
                </td>

                <td className={tdClass}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-3 transition-opacity duration-200"
                        isLoading={saving}
                        onPress={() => saveEdit(topic.id!)}
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
                      {onTopicUpdated && topic.id && (
                        <Button
                          size="sm"
                          variant="flat"
                          className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
                          onPress={() => startEdit(topic)}
                        >
                          {t('common.edit')}
                        </Button>
                      )}
                      {onTopicRemoved && topic.id && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          className="text-xs font-semibold rounded-lg h-8 px-3"
                          isLoading={removingId === topic.id}
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
                  size="sm"
                  placeholder={t('certification.topicNamePlaceholder')}
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
                    onPress={() => { setIsAddingTopic(false); setAddState({ name: '', min: 0, max: 0 }); }}
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
    {(!isAddingTopic && onTopicAdded) || onEditCertification ? (
      <div className="mt-3 flex gap-2">
        {onEditCertification && (
          <Button
            size="sm"
            variant="flat"
            className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
            onPress={onEditCertification}
          >
            {t('certification.editCertification')}
          </Button>
        )}
        {!isAddingTopic && onTopicAdded && (
          <Button
            size="sm"
            variant="flat"
            className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
            onPress={() => setIsAddingTopic(true)}
          >
            {t('certification.addTopic')}
          </Button>
        )}
      </div>
    ) : null}
  </>
  );
}
