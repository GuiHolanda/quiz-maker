'use client';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

import { PublicExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface TopicItemProps {
  readonly topic: PublicExamTopic;
  readonly onRemove?: (topicId: string, name: string) => Promise<void>;
  readonly onUpdate?: (topicId: string, newName: string) => Promise<void>;
}

export function TopicItem({ topic, onRemove, onUpdate }: TopicItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(topic.name);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditValue(topic.name);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditValue(topic.name);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!editValue.trim() || !onUpdate || !topic.id) return;
    setSaving(true);
    try {
      await onUpdate(topic.id, editValue.trim());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return isEditing ? renderEditMode() : renderViewMode();

  function renderViewMode() {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-content1 hover:bg-content2 border border-transparent hover:border-default-200 transition-colors group">
        <span className="text-xs text-default-700 leading-relaxed flex-1">{topic.name}</span>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onUpdate && topic.id && (
            <button
              aria-label={t('common.edit')}
              className="p-1 rounded text-default-400 hover:text-primary hover:bg-default-200 transition-colors"
              type="button"
              onClick={startEdit}
            >
              <FontAwesomeIcon className="w-2.5 h-2.5" icon={faPen} />
            </button>
          )}
          {onRemove && topic.id && (
            <button
              aria-label={t('common.remove')}
              className="p-1 rounded text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
              type="button"
              onClick={() => onRemove(topic.id!, topic.name)}
            >
              <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderEditMode() {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 bg-content1 border border-primary/40 shadow-sm">
        <Input
          {...inputProperties.input}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="flex-1"
          size="sm"
          value={editValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          onValueChange={setEditValue}
        />
        <Button
          isIconOnly
          aria-label={t('common.save')}
          className="bg-primary text-primary-foreground h-7 w-7 min-w-0 shrink-0"
          isLoading={saving}
          size="sm"
          onPress={saveEdit}
        >
          {!saving && <FontAwesomeIcon className="w-3 h-3" icon={faCheck} />}
        </Button>
        <button
          aria-label={t('common.cancel')}
          className="p-1 rounded text-default-400 hover:text-danger transition-colors shrink-0"
          type="button"
          onClick={cancelEdit}
        >
          <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
        </button>
      </div>
    );
  }
}
