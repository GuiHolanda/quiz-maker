'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { PublicExamTopic } from '@/shared/types';

interface TopicItemProps {
  readonly topic: PublicExamTopic;
  readonly onRemove?: (topicId: string, name: string) => void;
}

export function TopicItem({ topic, onRemove }: TopicItemProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-default-100 transition-colors group">
      <span className="text-xs text-default-600 leading-relaxed">{topic.name}</span>
      {onRemove && topic.id && (
        <button
          type="button"
          className="shrink-0 text-default-300 hover:text-danger transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
          onClick={() => onRemove(topic.id!, topic.name)}
          aria-label={`Remove ${topic.name}`}
        >
          <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
