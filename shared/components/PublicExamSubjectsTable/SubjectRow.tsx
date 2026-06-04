'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PublicExamSubject, PublicExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { TopicsExpandedRow } from './TopicsExpandedRow';

const SLIDER_CLASS_NAMES = {
  label: 'text-xs text-default-500 font-bold',
  value: 'text-xs font-bold',
  labelWrapper: 'flex flex-col items-start',
  thumb: 'h-3 w-4',
};

const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

interface SubjectRowProps {
  readonly subject: PublicExamSubject;
  readonly index: number;
  readonly isLast: boolean;
  readonly editable?: boolean;
  readonly isRemoving: boolean;
  readonly onSliderChange?: (field: 'minQuestions' | 'maxQuestions', value: number) => void;
  readonly onUpdate?: (newName: string, min: number, max: number) => Promise<void>;
  readonly onRemove?: () => void;
  readonly onTopicAdded?: (topic: PublicExamTopic) => void;
  readonly onTopicRemoved?: (topicId: string) => void;
  readonly addTopic?: (name: string) => Promise<PublicExamTopic>;
  readonly removeTopic?: (topicId: string, name: string) => Promise<void>;
  readonly updateTopic?: (topicId: string, newName: string) => Promise<void>;
}

interface EditState {
  name: string;
  min: number;
  max: number;
}

export function SubjectRow({
  subject,
  index,
  isLast,
  editable = false,
  isRemoving,
  onSliderChange,
  onUpdate,
  onRemove,
  onTopicAdded,
  onTopicRemoved,
  addTopic,
  removeTopic,
  updateTopic,
}: SubjectRowProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({ name: subject.name, min: subject.minQuestions, max: subject.maxQuestions });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tdClass = isLast ? TD_LAST : TD;
  const rowBg = index % 2 === 0 ? 'bg-content1' : 'bg-default-50';

  const startEdit = () => {
    setEditState({ name: subject.name, min: subject.minQuestions, max: subject.maxQuestions });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(editState.name, editState.min, editState.max);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTopic = addTopic && onTopicAdded
    ? async (name: string) => {
        const topic = await addTopic(name);
        onTopicAdded(topic);
      }
    : undefined;

  const handleRemoveTopic = removeTopic && onTopicRemoved
    ? async (topicId: string, name: string) => {
        await removeTopic(topicId, name);
        onTopicRemoved(topicId);
      }
    : undefined;

  return (
    <React.Fragment>
      <tr className={rowBg}>
        {renderNameCell()}
        {renderMinCell()}
        {renderMaxCell()}
        {renderTopicsToggleCell()}
        {renderActionsCell()}
      </tr>
      {subject.id && expanded && renderTopicsRow()}
    </React.Fragment>
  );

  function renderNameCell() {
    return (
      <td className={tdClass}>
        {isEditing ? (
          <Input
            {...inputProperties.input}
            size="sm"
            value={editState.name}
            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            className="w-48"
          />
        ) : (
          subject.name
        )}
      </td>
    );
  }

  function renderMinCell() {
    return (
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
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
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
            onChange={(val) => onSliderChange?.('minQuestions', val as number)}
          />
        ) : (
          `${subject.minQuestions}%`
        )}
      </td>
    );
  }

  function renderMaxCell() {
    return (
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
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
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
            onChange={(val) => onSliderChange?.('maxQuestions', val as number)}
          />
        ) : (
          `${subject.maxQuestions}%`
        )}
      </td>
    );
  }

  function renderTopicsToggleCell() {
    return (
      <td className={tdClass}>
        {subject.id ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-default-100 hover:bg-default-200 transition-colors text-xs text-default-600 font-medium"
          >
            <FontAwesomeIcon
              icon={expanded ? faChevronDown : faChevronRight}
              className="w-2.5 h-2.5 text-default-400"
            />
            {(subject.topics ?? []).length} {t('concurso.topics')}
          </button>
        ) : (
          <span className="text-xs text-default-400">—</span>
        )}
      </td>
    );
  }

  function renderActionsCell() {
    return (
      <td className={tdClass}>
        {isEditing ? renderEditingActions() : renderViewActions()}
      </td>
    );
  }

  function renderEditingActions() {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-3 transition-opacity duration-200"
          isLoading={saving}
          onPress={saveEdit}
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
    );
  }

  function renderViewActions() {
    return (
      <div className="flex gap-2">
        {onUpdate && subject.id && (
          <Button
            size="sm"
            variant="flat"
            className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg h-8 px-3 transition-colors duration-200"
            onPress={startEdit}
          >
            {t('common.edit')}
          </Button>
        )}
        {onRemove && subject.id && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            className="text-xs font-semibold rounded-lg h-8 px-3"
            isLoading={isRemoving}
            onPress={onRemove}
          >
            {t('common.remove')}
          </Button>
        )}
      </div>
    );
  }

  function renderTopicsRow() {
    return (
      <TopicsExpandedRow
        subjectId={subject.id!}
        topics={subject.topics ?? []}
        onRemoveTopic={handleRemoveTopic}
        onUpdateTopic={updateTopic}
        onAddTopic={handleAddTopic}
      />
    );
  }
}
