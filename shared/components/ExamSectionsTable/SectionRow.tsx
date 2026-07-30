'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { ExamTopicsExpandedRow } from './ExamTopicsExpandedRow';

import { ExamSection, ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const SLIDER_CLASS_NAMES = {
  label: 'text-xs text-default-500 font-bold',
  value: 'text-xs font-bold',
  labelWrapper: 'flex flex-col items-start',
  thumb: 'h-3 w-4',
};

const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

interface SectionRowProps {
  readonly section: ExamSection;
  readonly isLast: boolean;
  readonly showTopics: boolean;
  readonly editable?: boolean;
  readonly isRemoving: boolean;
  readonly onSliderChange?: (field: 'minQuestions' | 'maxQuestions', value: number) => void;
  readonly onUpdate?: (newName: string, min: number, max: number) => Promise<void>;
  readonly onRemove?: () => void;
  readonly onTopicAdded?: (topic: ExamTopic) => void;
  readonly onTopicRemoved?: (topicId: string) => void;
  readonly addTopic?: (name: string) => Promise<ExamTopic>;
  readonly removeTopic?: (topicId: string, name: string) => Promise<void>;
  readonly updateTopic?: (topicId: string, newName: string) => Promise<void>;
}

interface EditState {
  name: string;
  min: number;
  max: number;
}

export function SectionRow({
  section,
  isLast,
  showTopics,
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
}: SectionRowProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    name: section.name,
    min: section.minQuestions,
    max: section.maxQuestions,
  });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tdClass = isLast ? TD_LAST : TD;
  const rowBg = 'bg-content1 hover:bg-content2 transition-colors duration-150';

  const startEdit = () => {
    setEditState({ name: section.name, min: section.minQuestions, max: section.maxQuestions });
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

  const handleAddTopic =
    addTopic && onTopicAdded
      ? async (name: string) => {
          const topic = await addTopic(name);

          onTopicAdded(topic);
        }
      : undefined;

  const handleRemoveTopic =
    removeTopic && onTopicRemoved
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
        {showTopics && renderTopicsToggleCell()}
        {renderActionsCell()}
      </tr>
      {showTopics && section.id && expanded && renderTopicsRow()}
    </React.Fragment>
  );

  function renderNameCell() {
    return (
      <td className={tdClass}>
        {isEditing ? (
          <Input
            {...inputProperties.input}
            className="w-48"
            size="sm"
            value={editState.name}
            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        ) : (
          section.name
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
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        ) : editable && section.id ? (
          <Slider
            showTooltip
            aria-label="minQuestions"
            className="w-36"
            classNames={SLIDER_CLASS_NAMES}
            maxValue={100}
            minValue={0}
            size="sm"
            step={1}
            value={section.minQuestions}
            onChange={(val) => onSliderChange?.('minQuestions', val as number)}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span>{`${Math.round(section.minQuestions ?? 0)}%`}</span>
            {section.minQuestions === 0 && section.maxQuestions === 0 && (
              <span className="text-warning text-xs">⚠</span>
            )}
          </div>
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
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        ) : editable && section.id ? (
          <Slider
            showTooltip
            aria-label="maxQuestions"
            className="w-36"
            classNames={SLIDER_CLASS_NAMES}
            maxValue={100}
            minValue={0}
            size="sm"
            step={1}
            value={section.maxQuestions}
            onChange={(val) => onSliderChange?.('maxQuestions', val as number)}
          />
        ) : (
          `${Math.round(section.maxQuestions ?? 0)}%`
        )}
      </td>
    );
  }

  function renderTopicsToggleCell() {
    return (
      <td className={tdClass}>
        {section.id ? (
          <button
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-content2 hover:bg-primary/10 hover:text-primary transition-colors text-xs text-default-400 font-medium"
            type="button"
            onClick={() => setExpanded((v) => !v)}
          >
            <FontAwesomeIcon
              className="w-2.5 h-2.5 text-default-400"
              icon={expanded ? faChevronDown : faChevronRight}
            />
            {(section.topics ?? []).length} {t('exam.topics')}
          </button>
        ) : (
          <span className="text-xs text-default-400">—</span>
        )}
      </td>
    );
  }

  function renderActionsCell() {
    return <td className={tdClass}>{isEditing ? renderEditingActions() : renderViewActions()}</td>;
  }

  function renderEditingActions() {
    return (
      <div className="flex gap-2">
        <Button className={buttonStyles.primarySm} isLoading={saving} size="sm" onPress={saveEdit}>
          {t('common.save')}
        </Button>
        <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={cancelEdit}>
          {t('common.cancel')}
        </Button>
      </div>
    );
  }

  function renderViewActions() {
    return (
      <div className="flex gap-2">
        {onUpdate && section.id && (
          <Button className={buttonStyles.flat} size="sm" variant="flat" onPress={startEdit}>
            {t('common.edit')}
          </Button>
        )}
        {onRemove && section.id && (
          <Button className={buttonStyles.dangerFlat} isLoading={isRemoving} size="sm" onPress={onRemove}>
            {t('common.remove')}
          </Button>
        )}
      </div>
    );
  }

  function renderTopicsRow() {
    return (
      <ExamTopicsExpandedRow
        sectionId={section.id!}
        topics={section.topics ?? []}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
        onUpdateTopic={updateTopic}
      />
    );
  }
}
