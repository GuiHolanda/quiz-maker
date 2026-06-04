'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { PublicExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { TopicItem } from './TopicItem';

interface TopicsExpandedRowProps {
  readonly subjectId: string;
  readonly topics: PublicExamTopic[];
  readonly onRemoveTopic?: (topicId: string, name: string) => Promise<void>;
  readonly onUpdateTopic?: (topicId: string, newName: string) => Promise<void>;
  readonly onAddTopic?: (name: string) => Promise<void>;
}

export function TopicsExpandedRow({ subjectId, topics, onRemoveTopic, onUpdateTopic, onAddTopic }: TopicsExpandedRowProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!topicName.trim() || !onAddTopic) return;
    setSaving(true);
    try {
      await onAddTopic(topicName.trim());
      setTopicName('');
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setTopicName('');
  };

  return (
    <tr>
      <td colSpan={5} className="px-4 pb-3 pt-0 border-b border-default-200">
        <div className="ml-2 border-l-2 border-primary/20 pl-3">
          <div className="flex flex-col gap-0.5 mb-2">
            {topics.map((topic) => (
              <TopicItem
                key={topic.id ?? topic.name}
                topic={topic}
                onRemove={onRemoveTopic}
                onUpdate={onUpdateTopic}
              />
            ))}
          </div>

          {isAdding ? (
            <div className="flex gap-1 items-center mt-1">
              <Input
                {...inputProperties.input}
                size="sm"
                placeholder={t('concurso.topicNamePlaceholder')}
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-56"
                autoFocus
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground text-xs h-7 px-2"
                isLoading={saving}
                onPress={handleSave}
              >
                {t('common.save')}
              </Button>
              <Button
                size="sm"
                variant="light"
                className="text-xs h-7 px-2"
                onPress={handleCancel}
              >
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            onAddTopic && (
              <button
                type="button"
                className="text-xs text-primary hover:opacity-80 mt-1"
                onClick={() => setIsAdding(true)}
              >
                + {t('concurso.addTopic')}
              </button>
            )
          )}
        </div>
      </td>
    </tr>
  );
}
