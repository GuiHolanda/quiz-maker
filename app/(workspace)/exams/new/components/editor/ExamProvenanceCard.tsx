'use client';
import type { ReactNode } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faFileText, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ExamProvenanceCardProps {
  readonly context: string;
  readonly sources: readonly string[];
}

interface ParsedSource {
  readonly title: string;
  readonly url: string | null;
  readonly host: string | null;
}

// Sources are markdown links — "[Title](https://...)" — with a bare-URL fallback.
function parseSource(source: string): ParsedSource {
  const match = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/.exec(source);
  const title = match ? match[1] : source;
  const url = match ? match[2] : /^https?:\/\//.test(source.trim()) ? source.trim() : null;

  if (!url) return { title, url: null, host: null };

  try {
    return { title, url, host: new URL(url).hostname };
  } catch {
    return { title, url, host: null };
  }
}

// The model's context sentence uses **bold** — render it instead of showing raw asterisks.
function renderMarkdownBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export function ExamProvenanceCard({ context, sources }: ExamProvenanceCardProps) {
  const { t } = useTranslation();
  const parsedSources = sources.map(parseSource);

  return (
    <div className="bg-primary/[0.07] border border-primary/30 rounded-xl p-5">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faCircleInfo} />
        <div className="text-xs font-semibold text-foreground">{t('exam.aiSeedProvenanceTitle')}</div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-default-500 text-pretty">{renderMarkdownBold(context)}</p>

      {parsedSources.length > 0 && (
        <div className="mt-3.5 pt-3.5 border-t border-primary/20 flex flex-col gap-1">
          {parsedSources.map((source, i) =>
            source.url ? (
              <a
                key={i}
                className="grid grid-cols-[14px_1fr_12px] gap-2.5 items-start py-1.5 group"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon className="w-3.5 h-3.5 mt-0.5 text-default-500" icon={faFileText} />
                <span className="min-w-0">
                  <span className="block text-xs text-foreground group-hover:text-primary transition-colors">
                    {source.title}
                  </span>
                  {source.host && <span className="block text-[11px] text-default-400 mt-0.5">{source.host}</span>}
                </span>
                <FontAwesomeIcon
                  className="w-3 h-3 mt-0.5 text-default-400 group-hover:text-primary transition-colors"
                  icon={faArrowUpRightFromSquare}
                />
              </a>
            ) : (
              <div key={i} className="grid grid-cols-[14px_1fr] gap-2.5 items-start py-1.5">
                <FontAwesomeIcon className="w-3.5 h-3.5 mt-0.5 text-default-500" icon={faFileText} />
                <span className="text-xs text-foreground">{source.title}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
