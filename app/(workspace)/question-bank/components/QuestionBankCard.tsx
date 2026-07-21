'use client';

import { useId, useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faCheck,
  faTriangleExclamation,
  faGraduationCap,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { UnifiedQuestion } from '@/shared/types';

interface QuestionBankCardProps {
  readonly question: UnifiedQuestion;
  readonly onDeleteRequest: (id: number, type: 'certification' | 'public_exam') => void;
}

function difficultyColor(d: string): 'success' | 'warning' | 'danger' | 'default' {
  const n = d.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n === 'easy' || n === 'facil') return 'success';
  if (n === 'medium' || n === 'medio') return 'warning';
  if (n === 'hard' || n === 'dificil') return 'danger';
  return 'default';
}

export function QuestionBankCard({ question, onDeleteRequest }: QuestionBankCardProps) {
  const { t } = useTranslation();
  const explanationsPanelId = useId();
  const [showExplanations, setShowExplanations] = useState(false);

  const hasAnswer = !!question.answer && question.answer.correctOptions.length > 0;
  const hasExplanations = hasAnswer && Object.keys(question.answer!.explanations).length > 0;
  const correctOptions = question.answer?.correctOptions ?? [];
  const explanations = question.answer?.explanations ?? {};

  return (
    <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
      {renderHeader()}
      {renderQuestionText()}
      {renderOptions()}
      {renderFooter()}
      {hasExplanations && renderExplanationsToggle()}
      <AnimatePresence initial={false}>
        {showExplanations && renderExplanationsPanel()}
      </AnimatePresence>
    </div>
  );

  function renderHeader() {
    return (
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-default-100">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0">
            <FontAwesomeIcon
              aria-hidden="true"
              className="w-3 h-3"
              icon={question.type === 'certification' ? faGraduationCap : faClipboardList}
            />
            {question.sourceLabel}
          </span>
          {question.topic && (
            <>
              <span aria-hidden="true" className="text-default-300 text-xs shrink-0">·</span>
              <span className="text-xs text-default-500 truncate">{question.topic}</span>
            </>
          )}
        </div>
        <Button
          isIconOnly
          aria-label={t('questionBank.deleteQuestion')}
          className={buttonStyles.iconOnly.danger}
          size="sm"
          variant="light"
          onPress={() => onDeleteRequest(question.id, question.type)}
        >
          <FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faTrash} />
        </Button>
      </div>
    );
  }

  function renderQuestionText() {
    return (
      <div className="px-5 pt-4 pb-3">
        <p className="text-sm font-semibold text-foreground leading-relaxed">{question.text}</p>
      </div>
    );
  }

  function renderOptions() {
    return (
      <ul aria-label={t('browse.optionsSectionLabel')} className="px-5 pb-4 flex flex-col gap-2">
        {Object.entries(question.options).map(([label, text]) => renderOption(label, text))}
      </ul>
    );
  }

  function renderOption(label: string, text: string) {
    const isCorrect = hasAnswer && correctOptions.includes(label);

    return (
      <li
        key={label}
        aria-label={isCorrect ? t('questionBank.optionCorrect', { label }) : t('questionBank.optionLabel', { label })}
        className={
          isCorrect
            ? 'flex gap-3 items-start p-3 rounded-lg border border-success-500/60 bg-success-100 dark:bg-success-500/15 dark:border-success-500/40'
            : 'flex gap-3 items-start p-3 rounded-lg border border-default-200'
        }
      >
        <span
          aria-hidden="true"
          className={
            isCorrect
              ? 'flex-shrink-0 h-5 w-5 grid place-items-center rounded-full bg-success-500/20 text-success-700 dark:text-success-400 text-xs font-bold'
              : 'flex-shrink-0 h-5 w-5 grid place-items-center rounded-full bg-content2 text-default-500 text-xs font-bold'
          }
        >
          {label}
        </span>
        {isCorrect && (
          <FontAwesomeIcon
            aria-hidden="true"
            className="text-success-600 dark:text-success-400 mt-0.5 h-3 w-3 flex-shrink-0"
            icon={faCheck}
          />
        )}
        <span className="text-sm text-foreground leading-relaxed">{text}</span>
      </li>
    );
  }

  function renderFooter() {
    return (
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-default-100 pt-3">
        <Chip className="capitalize" color={difficultyColor(question.difficulty)} size="sm" variant="flat">
          {question.difficulty}
        </Chip>
        <Chip color={hasAnswer ? 'success' : 'warning'} size="sm" variant="flat">
          {hasAnswer ? t('browse.hasAnswer') : t('browse.noAnswer')}
        </Chip>
        {hasExplanations && (
          <Chip color="secondary" size="sm" variant="flat">
            {t('questionBank.hasExplanation')}
          </Chip>
        )}
        {!hasAnswer && renderNoAnswerNote()}
      </div>
    );
  }

  function renderNoAnswerNote() {
    return (
      <div
        role="status"
        className="w-full mt-2 flex items-start gap-2 rounded-lg border border-warning-300 bg-warning-100 dark:bg-warning-500/15 dark:border-warning-500/40 p-3"
      >
        <FontAwesomeIcon
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-600 dark:text-warning-300"
          icon={faTriangleExclamation}
        />
        <span className="text-xs text-foreground leading-relaxed">{t('browse.noAnswerBanner')}</span>
      </div>
    );
  }

  function renderExplanationsToggle() {
    return (
      <div className="px-5 pb-4">
        <Button
          aria-controls={explanationsPanelId}
          aria-expanded={showExplanations}
          className={`${buttonStyles.flat} h-7 px-3 text-xs`}
          size="sm"
          onPress={() => setShowExplanations((v) => !v)}
        >
          {showExplanations ? t('questionBank.hideExplanations') : t('questionBank.showExplanations')}
        </Button>
      </div>
    );
  }

  function renderExplanationsPanel() {
    return (
      <motion.div
        key="explanations"
        id={explanationsPanelId}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t border-default-100">
          <p className="text-xs font-semibold text-default-500">{t('browse.explanationsSectionLabel')}</p>
          {Object.entries(explanations).map(([label, text]) => renderExplanationRow(label, text))}
        </div>
      </motion.div>
    );
  }

  function renderExplanationRow(label: string, text: string) {
    const isCorrect = correctOptions.includes(label);

    return (
      <div key={label} className="rounded-lg bg-content2 p-3">
        <p className={`text-xs font-bold mb-1.5 ${isCorrect ? 'text-success-600 dark:text-success-400' : 'text-default-400'}`}>
          {label} — {isCorrect ? t('browse.correct') : t('browse.incorrect')}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
      </div>
    );
  }
}
