'use client';
import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

import { ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamTopicRowProps {
  readonly topic: ExamTopic;
  readonly isSaving: boolean;
  readonly onRename: (newName: string) => void;
  readonly onRemove: () => void;
}

// Sits outside the distribution table's grid — pl-[52px] aligns it under the name column.
export function ExamTopicRow({ topic, isSaving, onRename, onRemove }: ExamTopicRowProps) {
  const { t } = useTranslation();
  const [editValue, setEditValue] = useState<string | null>(null);
  const isEditing = editValue != null;

  const confirmEdit = () => {
    if (editValue?.trim()) {
      onRename(editValue);
      setEditValue(null);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-content1 border-b border-default-100 pl-[52px] pr-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Input
            {...inputProperties.input}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="flex-1"
            size="sm"
            value={editValue ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmEdit();
              if (e.key === 'Escape') setEditValue(null);
            }}
            onValueChange={setEditValue}
          />
          <Button
            isIconOnly
            aria-label={t('common.save')}
            className={`${buttonStyles.iconOnly.primary} h-6 w-6 min-w-0 shrink-0`}
            isDisabled={!editValue?.trim()}
            size="sm"
            onPress={confirmEdit}
          >
            <FontAwesomeIcon className="w-2.5 h-2.5" icon={faCheck} />
          </Button>
          <button
            aria-label={t('common.cancel')}
            className="p-1 rounded text-default-400 hover:text-danger transition-colors shrink-0"
            type="button"
            onClick={() => setEditValue(null)}
          >
            <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-content1 border-b border-default-100 pl-[52px] pr-3 py-1 group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-default-700 leading-relaxed break-words min-w-0">{topic.name}</span>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {!isSaving && (
            <button
              aria-label={t('common.edit')}
              className="p-1 rounded text-default-400 hover:text-primary hover:bg-default-100 transition-colors"
              type="button"
              onClick={() => setEditValue(topic.name)}
            >
              <FontAwesomeIcon className="w-2.5 h-2.5" icon={faPen} />
            </button>
          )}
          {!isSaving && (
            <button
              aria-label={t('exam.removeTopicNamed', { name: topic.name })}
              className="p-1 rounded text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
              type="button"
              onClick={onRemove}
            >
              <FontAwesomeIcon className="w-2.5 h-2.5" icon={faXmark} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
