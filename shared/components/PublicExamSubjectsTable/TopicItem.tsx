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
      <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-default-50 hover:bg-default-100 border border-transparent hover:border-default-200 transition-colors group">
        <span className="text-xs text-default-700 leading-relaxed flex-1">{topic.name}</span>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onUpdate && topic.id && (
            <button
              type="button"
              onClick={startEdit}
              className="p-1 rounded text-default-400 hover:text-primary hover:bg-default-200 transition-colors"
              aria-label={t('common.edit')}
            >
              <FontAwesomeIcon icon={faPen} className="w-2.5 h-2.5" />
            </button>
          )}
          {onRemove && topic.id && (
            <button
              type="button"
              onClick={() => onRemove(topic.id!, topic.name)}
              className="p-1 rounded text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
              aria-label={t('common.remove')}
            >
              <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
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
          size="sm"
          value={editValue}
          onValueChange={setEditValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="flex-1"
          autoFocus
        />
        <Button
          isIconOnly
          size="sm"
          className="bg-primary text-primary-foreground h-7 w-7 min-w-0 shrink-0"
          isLoading={saving}
          onPress={saveEdit}
          aria-label={t('common.save')}
        >
          {!saving && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
        </Button>
        <button
          type="button"
          onClick={cancelEdit}
          className="p-1 rounded text-default-400 hover:text-danger transition-colors shrink-0"
          aria-label={t('common.cancel')}
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
        </button>
      </div>
    );
  }
}
