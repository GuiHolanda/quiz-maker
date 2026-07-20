'use client';
import { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface QuestionBrowseDetailPanelProps {
  readonly questionText: string;
  readonly difficulty: string;
  readonly options: Record<string, string>;
  readonly correctOptions: string[];
  readonly explanations: Record<string, string>;
  readonly onClose: () => void;
}

export function QuestionBrowseDetailPanel({
  questionText,
  difficulty,
  options,
  correctOptions,
  explanations,
  onClose,
}: QuestionBrowseDetailPanelProps) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const hasAnswer = correctOptions.length > 0;
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
    <div
      aria-labelledby={headingId}
      className="bg-content1 border-t border-default-200 max-h-[70vh] overflow-y-auto"
      role="region"
    >
      {renderHeader()}
      {renderQuestionStem()}
      {renderOptions()}
      {renderExplanations()}
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between gap-3 px-5 md:px-6 pt-5 md:pt-6">
        <div className="flex items-center gap-2 min-w-0">
          <FontAwesomeIcon className="text-default-400 h-3.5 w-3.5" icon={faCircleInfo} />
          <span className="text-xs font-semibold text-primary">{t('browse.questionDetails')}</span>
          <Chip className="capitalize" color="default" size="sm" variant="flat">
            {difficulty}
          </Chip>
          {isMultiCorrect && (
            <Chip color="success" size="sm" variant="flat">
              {t('browse.multipleCorrect', { count: correctOptions.length })}
            </Chip>
          )}
        </div>
        <Button
          ref={closeButtonRef}
          isIconOnly
          aria-label={t('common.close')}
          className="h-11 w-11 min-w-11 text-default-400 hover:text-foreground"
          radius="md"
          size="sm"
          variant="light"
          onPress={onClose}
        >
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faXmark} />
        </Button>
      </div>
    );
  }

  function renderQuestionStem() {
    return (
      <p
        className="mt-4 px-5 md:px-6 text-sm md:text-base font-semibold text-foreground leading-relaxed max-w-prose"
        id={headingId}
      >
        {questionText}
      </p>
    );
  }

  function renderOptions() {
    return (
      <div className="mt-6 px-5 md:px-6">
        <p className="text-xs font-semibold text-primary mb-2">{t('browse.optionsSectionLabel')}</p>
        <ul className="flex flex-col gap-2">
          {Object.entries(options).map(([label, text]) => renderOptionRow(label, text))}
        </ul>
      </div>
    );
  }

  function renderOptionRow(label: string, text: string) {
    const isCorrect = correctOptions.includes(label);

    return (
      <li
        key={label}
        className={
          isCorrect
            ? 'flex gap-3 items-start p-3 rounded-lg border border-success-500/60 bg-success-100 dark:bg-success-500/15 dark:border-success-500/40 transition-colors duration-150'
            : 'flex gap-3 items-start p-3 rounded-lg border border-default-200 transition-colors duration-150'
        }
      >
        <span
          className={
            isCorrect
              ? 'flex-shrink-0 h-6 w-6 grid place-items-center rounded-full bg-success-100 text-success-700 text-xs font-bold'
              : 'flex-shrink-0 h-6 w-6 grid place-items-center rounded-full bg-content2 text-default-400 text-xs font-bold'
          }
        >
          {label}
        </span>
        {isCorrect && (
          <FontAwesomeIcon className="text-success-600 mt-1 h-3.5 w-3.5 flex-shrink-0" icon={faCheck} />
        )}
        <span className="text-sm text-foreground leading-relaxed max-w-prose">{text}</span>
      </li>
    );
  }

  function renderExplanations() {
    if (!hasAnswer || !hasExplanations) {
      return (
        <div className="mt-6 mb-5 md:mb-6 px-5 md:px-6">
          <div className="flex items-start gap-3 rounded-lg border border-warning-300 bg-warning-100 dark:bg-warning-500/15 dark:border-warning-500/40 p-3 text-sm leading-relaxed text-foreground">
            <FontAwesomeIcon
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-600 dark:text-warning-300"
              icon={faTriangleExclamation}
            />
            <span>{t('browse.noAnswerBanner')}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 mb-5 md:mb-6 px-5 md:px-6">
        <p className="text-xs font-semibold text-primary mb-2">{t('browse.explanationsSectionLabel')}</p>
        <div className="flex flex-col gap-3">
          {Object.entries(explanations).map(([label, explanation]) => renderExplanationRow(label, explanation))}
        </div>
      </div>
    );
  }

  function renderExplanationRow(label: string, explanation: string) {
    const isCorrect = correctOptions.includes(label);

    return (
      <div key={label} className="border-l-2 border-l-primary/40 pl-3 py-1">
        <p className="text-xs font-bold text-primary mb-1">
          {label} — {isCorrect ? t('browse.correct') : t('browse.incorrect')}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed max-w-prose">{explanation}</p>
      </div>
    );
  }
}
