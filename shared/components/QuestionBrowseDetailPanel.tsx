'use client';
import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface QuestionBrowseDetailPanelProps {
  readonly questionText: string;
  readonly difficulty: string;
  readonly hasAnswer: boolean;
  readonly options: Record<string, string>;
  readonly correctOptions: string[];
  readonly explanations: Record<string, string>;
  readonly onClose: () => void;
}

function difficultyColor(d: string): 'success' | 'warning' | 'danger' | 'default' {
  const lower = d.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (lower === 'easy' || lower === 'facil') return 'success';
  if (lower === 'medium' || lower === 'medio') return 'warning';
  if (lower === 'hard' || lower === 'dificil') return 'danger';
  return 'default';
}

export function QuestionBrowseDetailPanel({
  questionText,
  difficulty,
  hasAnswer,
  options,
  correctOptions,
  explanations,
  onClose,
}: QuestionBrowseDetailPanelProps) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasExplanations = Object.keys(explanations).length > 0;
  const isMultiCorrect = correctOptions.length > 1;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div aria-label={questionText} className="bg-content1 border-t border-default-200" role="region">
      <div className="px-5 md:px-6 pb-6 md:pb-8 mt-4 flex flex-col gap-5">
        {renderOptions()}
        {renderMetaChips()}
        {hasAnswer && hasExplanations ? renderExplanations() : renderNoAnswerBanner()}
      </div>
    </div>
  );

  function renderMetaChips() {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Chip className="capitalize" color={difficultyColor(difficulty)} size="sm" variant="solid">
          {difficulty}
        </Chip>
        <Chip color={hasAnswer ? 'success' : 'warning'} size="sm" variant="solid">
          {hasAnswer ? t('browse.hasAnswer') : t('browse.noAnswer')}
        </Chip>
        {isMultiCorrect && (
          <Chip color="secondary" size="sm" variant="solid">
            {t('browse.multipleCorrect', { count: correctOptions.length })}
          </Chip>
        )}
      </div>
    );
  }

  function renderOptions() {
    return (
      <ul className="flex flex-col gap-3">
        {Object.entries(options).map(([label, text]) => renderOptionRow(label, text))}
      </ul>
    );
  }

  function renderOptionRow(label: string, text: string) {
    const isCorrect = correctOptions.includes(label);

    return (
      <li
        key={label}
        className={
          isCorrect
            ? 'flex gap-3 items-start p-3 rounded-lg border border-success-500/60 bg-success-100 dark:bg-success-500/15 dark:border-success-500/40'
            : 'flex gap-3 items-start p-3 rounded-lg border border-default-200'
        }
      >
        <span
          className={
            isCorrect
              ? 'flex-shrink-0 h-6 w-6 grid place-items-center rounded-full bg-success-500/20 text-success-700 dark:text-success-400 text-xs font-bold'
              : 'flex-shrink-0 h-6 w-6 grid place-items-center rounded-full bg-content2 text-default-500 text-xs font-bold'
          }
        >
          {label}
        </span>
        {isCorrect && (
          <FontAwesomeIcon
            aria-hidden="true"
            className="text-success-600 dark:text-success-400 mt-0.5 h-3.5 w-3.5 flex-shrink-0"
            icon={faCheck}
          />
        )}
        <span className="text-sm text-foreground leading-relaxed">{text}</span>
      </li>
    );
  }

  function renderExplanations() {
    return (
      <div>
        <p className="text-sm font-semibold text-default-500 mb-3">{t('browse.explanationsSectionLabel')}</p>
        <div className="flex flex-col gap-3">
          {Object.entries(explanations).map(([label, explanation]) => renderExplanationRow(label, explanation))}
        </div>
      </div>
    );
  }

  function renderExplanationRow(label: string, explanation: string) {
    const isCorrect = correctOptions.includes(label);

    return (
      <div key={label} className="rounded-md bg-content2 p-3">
        <p
          className={`text-xs font-bold mb-2 ${isCorrect ? 'text-success-600 dark:text-success-400' : 'text-default-400'}`}
        >
          {label} — {isCorrect ? t('browse.correct') : t('browse.incorrect')}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">{explanation}</p>
      </div>
    );
  }

  function renderNoAnswerBanner() {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-warning-300 bg-warning-100 dark:bg-warning-500/15 dark:border-warning-500/40 p-3 text-sm leading-relaxed text-foreground">
        <FontAwesomeIcon
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-600 dark:text-warning-300"
          icon={faTriangleExclamation}
        />
        <span>{t('browse.noAnswerBanner')}</span>
      </div>
    );
  }
}
