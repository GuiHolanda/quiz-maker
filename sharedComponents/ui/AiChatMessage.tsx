'use client';

import { ChatMessageRole } from '@/types';

interface AiChatMessageProps {
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly isStreaming?: boolean;
  readonly isError?: boolean;
}

const CERTIFICATION_DATA_BLOCK_REGEX = /```certification-data\n([\s\S]*?)```/g;

function stripCertificationDataBlocks(text: string): string {
  return text.replace(CERTIFICATION_DATA_BLOCK_REGEX, '').trim();
}

export function AiChatMessage({ role, content, isStreaming, isError }: AiChatMessageProps) {
  const isUser = role === 'user';
  const displayContent = role === 'assistant'
    ? stripCertificationDataBlocks(content)
    : content;
  const showPulsingDots = !isUser && !displayContent && isStreaming;

  const bubbleClasses = [
    'text-sm rounded-2xl px-4 py-3 max-w-[80%] whitespace-pre-wrap',
    isError
      ? 'bg-danger/10 border border-danger/20 text-foreground'
      : isUser
        ? 'bg-primary/10 text-foreground'
        : 'bg-content2 text-foreground',
  ].join(' ');

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="text-base leading-none mb-1 shrink-0" aria-hidden="true">
          🤖
        </span>
      )}
      <div className={bubbleClasses}>
        {showPulsingDots ? (
          <div className="flex gap-1 items-center py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-default-400 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : (
          displayContent
        )}
      </div>
    </div>
  );
}
