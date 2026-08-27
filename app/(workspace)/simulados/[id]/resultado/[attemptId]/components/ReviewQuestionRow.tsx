'use client';

import { useState } from 'react';
import { Skeleton } from '@heroui/skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faMinus, faChevronDown, faLightbulb } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

import type { QuestionStatus, ReviewQuestion } from './deriveResult';

interface ReviewQuestionRowProps {
  readonly question: ReviewQuestion;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly onLoadExplanation: (questionId: number) => Promise<Record<string, string>>;
}

const STATUS_META: Record<QuestionStatus, { icon: typeof faCheck; badge: string; label: string }> = {
  correct: { icon: faCheck, badge: 'bg-success/10 text-success', label: 'simulado.result.statusCorrect' },
  wrong: { icon: faXmark, badge: 'bg-danger/10 text-danger', label: 'simulado.result.statusWrong' },
  blank: { icon: faMinus, badge: 'bg-default-200 text-default-400', label: 'simulado.result.statusBlank' },
};

const COMMENT_SKELETON_ROWS: readonly (readonly string[])[] = [
  ['w-[94%]', 'w-[62%]'],
  ['w-[88%]'],
  ['w-full', 'w-[71%]'],
  ['w-[80%]'],
];

export function ReviewQuestionRow({ question, isOpen, onToggle, onLoadExplanation }: ReviewQuestionRowProps) {
  const { t } = useTranslation();
  const [explanations, setExplanations] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isShown, setIsShown] = useState(false);

  const meta = STATUS_META[question.status];

  async function loadExplanation() {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await onLoadExplanation(question.examQuestionId);

      setExplanations(data);
      setIsShown(true);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCommentButton() {
    if (explanations) setIsShown((shown) => !shown);
    else loadExplanation();
  }

  const reference = question.topicName
    ? t('simulado.result.referenceWithTopic', { section: question.sectionName, topic: question.topicName })
    : t('simulado.result.reference', { section: question.sectionName });

  return (
    <div className="overflow-hidden rounded-xl bg-content2">
      <button
        aria-expanded={isOpen}
        className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-default-100 sm:grid-cols-[2rem_minmax(0,1fr)_7rem_1.25rem] sm:gap-4"
        type="button"
        onClick={onToggle}
      >
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${meta.badge}`}>
          <FontAwesomeIcon icon={meta.icon} />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium leading-snug text-foreground">
            {question.order + 1}. {question.text}
          </span>
          <span className="mt-1 block truncate text-xs text-default-500">{question.sectionName}</span>
        </span>

        <span
          className={`hidden justify-self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-block ${meta.badge}`}
        >
          {t(meta.label)}
        </span>

        <FontAwesomeIcon
          className={`justify-self-end text-default-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          icon={faChevronDown}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-0 sm:pl-[3.75rem]">
          <div className="flex flex-col gap-2">
            {Object.entries(question.options).map(([key, text]) => {
              const isCorrect = question.correctOptions.includes(key);
              const isSelected = question.selectedOptions.includes(key);
              const isWrongPick = isSelected && !isCorrect;

              let shell = 'bg-content1';
              let letter = 'text-default-400';
              let body = 'text-default-500';
              let mark = '';

              if (isCorrect) {
                shell = 'border border-success/30 bg-success/10';
                letter = 'text-success';
                body = 'text-foreground';
                mark = isSelected ? t('simulado.result.markYoursCorrect') : t('simulado.result.markKey');
              } else if (isWrongPick) {
                shell = 'border border-danger/30 bg-danger/10';
                letter = 'text-danger';
                body = 'text-foreground';
                mark = t('simulado.result.markYours');
              }

              return (
                <div
                  key={key}
                  className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-3 rounded-lg p-3 ${shell}`}
                >
                  <span className={`font-mono text-sm ${letter}`}>{key}</span>
                  <span className={`text-sm leading-relaxed ${body}`}>{text}</span>
                  {mark && <span className={`whitespace-nowrap text-xs font-semibold ${letter}`}>{mark}</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-content1 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <FontAwesomeIcon icon={faLightbulb} />
                <span className="text-xs font-semibold">{t('simulado.result.commentedKey')}</span>
              </div>
              {!isLoading && !hasError && (
                <button
                  aria-expanded={explanations ? isShown : undefined}
                  className="rounded-lg border border-divider px-3 py-1.5 text-xs font-medium text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground"
                  type="button"
                  onClick={handleCommentButton}
                >
                  {explanations && isShown ? t('simulado.result.hideComment') : t('simulado.result.showComment')}
                </button>
              )}
            </div>

            {isLoading && (
              <div
                aria-label={t('simulado.result.loadingComment')}
                className="mt-3.5 flex flex-col gap-3"
                role="status"
              >
                {COMMENT_SKELETON_ROWS.map((lines, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3">
                    <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      {lines.map((width, lineIndex) => (
                        <Skeleton key={lineIndex} className={`h-3 rounded ${width}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasError && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-default-500">{t('simulado.result.commentError')}</p>
                <button
                  className="rounded-lg border border-divider px-3 py-1.5 text-xs text-default-500 transition-colors duration-200 hover:bg-content2 hover:text-foreground"
                  type="button"
                  onClick={loadExplanation}
                >
                  {t('simulado.result.retryComment')}
                </button>
              </div>
            )}

            {explanations && isShown && (
              <div className="mt-3 flex flex-col gap-2">
                {Object.entries(explanations).map(([label, text]) => (
                  <p key={label} className="text-sm leading-relaxed text-default-600">
                    <span className="font-mono font-semibold text-default-400">{label}</span> {text}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-divider pt-3">
              <span className="text-xs text-default-500">{reference}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
