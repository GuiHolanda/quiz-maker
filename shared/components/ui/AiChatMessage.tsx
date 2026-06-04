'use client';

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { ChatMessageRole } from '@/shared/types';

interface AiChatMessageProps {
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly isStreaming?: boolean;
  readonly isError?: boolean;
  readonly sources?: string[];
  readonly attachmentName?: string;
}

const CERTIFICATION_DATA_BLOCK_REGEX = /```certification-data\n([\s\S]*?)```/g;
const PARTIAL_CERT_BLOCK_REGEX = /```certification-data[\s\S]*/;

function stripCertificationDataBlocks(text: string): string {
  return text.replace(CERTIFICATION_DATA_BLOCK_REGEX, '').trim();
}

function parseMarkdownInline(text: string): ReactNode[] {
  const INLINE_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      result.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer"
           className="text-primary underline hover:opacity-80 transition-opacity">
          {match[1]}
        </a>
      );
    } else if (match[3] !== undefined) {
      result.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      result.push(<em key={match.index}>{match[4]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

export function AiChatMessage({ role, content, isStreaming, isError, sources, attachmentName }: AiChatMessageProps) {
  const isUser = role === 'user';
  const displayContent = role === 'assistant'
    ? isStreaming
      ? content.replace(PARTIAL_CERT_BLOCK_REGEX, '').trim()
      : stripCertificationDataBlocks(content)
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
          <>
            {parseMarkdownInline(displayContent)}
            {attachmentName && (
              <div className="flex items-center gap-1 mt-2 text-xs text-default-400">
                <FontAwesomeIcon icon={faFilePdf} className="text-danger text-xs shrink-0" />
                <span>{attachmentName}</span>
              </div>
            )}
            {sources && sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-default-200">
                <p className="text-xs text-default-400 mb-1">Sources:</p>
                {sources.map((source, i) => (
                  <div key={i} className="text-xs">{parseMarkdownInline(source)}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
