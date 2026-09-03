'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faEyeSlash,
  faLightbulb,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { FauxCheckbox } from '@/shared/components/ui/FauxCheckbox';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import type { UnifiedQuestion } from '@/shared/types';

interface QuestionBankCardProps {
  readonly question: UnifiedQuestion;
  readonly selected: boolean;
  readonly open: boolean;
  readonly isGeneratingExplanation: boolean;
  readonly onToggleSelect: () => void;
  readonly onToggleOpen: () => void;
  readonly onDeleteRequest: () => void;
  readonly onGenerateExplanation: () => void;
}

function difficultyColor(value: string): 'success' | 'warning' | 'danger' | 'default' {
  const normalized = value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (normalized === 'easy' || normalized === 'facil') return 'success';
  if (normalized === 'medium' || normalized === 'medio') return 'warning';
  if (normalized === 'hard' || normalized === 'dificil') return 'danger';
  return 'default';
}

const DIFFICULTY_DOT = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  default: 'bg-default-400',
} as const;

const SITUATION_META = {
  correct: { color: 'success' as const, icon: faCircleCheck, labelKey: 'questionBank.situationCorrect' },
  wrong: { color: 'danger' as const, icon: faCircleXmark, labelKey: 'questionBank.situationWrong' },
  unanswered: { color: 'default' as const, icon: faCircleQuestion, labelKey: 'questionBank.situationUnanswered' },
};

export function QuestionBankCard({
  question,
  selected,
  open,
  isGeneratingExplanation,
  onToggleSelect,
  onToggleOpen,
  onDeleteRequest,
  onGenerateExplanation,
}: QuestionBankCardProps) {
  const { t } = useTranslation();

  const { history } = question;
  const answered = history.situation !== 'unanswered';
  const correctOptions = question.answer?.correctOptions ?? [];
  const explanations = question.answer?.explanations ?? {};
  const hasExplanations = Object.keys(explanations).length > 0;

  return (
    <div
      data-testid="question-bank-card"
      className={`bg-content1 rounded-xl overflow-hidden border transition-colors duration-200 ${
        selected ? 'border-primary/45' : 'border-default-200 dark:border-transparent'
      }`}
    >
      <div className="flex flex-wrap items-start gap-x-[18px] gap-y-3 p-5">
        {renderCheckbox()}
        <div className="min-w-[240px] flex-1">
          {renderMeta()}
          <p className="my-4 text-base leading-relaxed">{question.text}</p>
          {renderFooterMeta()}
        </div>
        <div className="ml-auto">{renderActions()}</div>
      </div>

      <AnimatePresence initial={false}>{open && answered && renderExpanded()}</AnimatePresence>
    </div>
  );

  function renderCheckbox() {
    return (
      <button
        aria-label={t('questionBank.selectQuestion')}
        aria-pressed={selected}
        className="mt-0.5 rounded-[5px]"
        data-testid="question-bank-card-checkbox"
        type="button"
        onClick={onToggleSelect}
      >
        <FauxCheckbox checked={selected} />
      </button>
    );
  }

  function renderMeta() {
    const situation = SITUATION_META[history.situation];

    return (
      <div className="flex flex-wrap items-center gap-4">
        <Chip
          color={situation.color}
          size="sm"
          startContent={<FontAwesomeIcon aria-hidden="true" className="w-2.5 h-2.5 ml-1" icon={situation.icon} />}
          variant="flat"
        >
          {t(situation.labelKey)}
        </Chip>
        <div className="flex flex-wrap items-center gap-4 text-xs text-navy-400 font-semibold">
          <span className="max-w-md truncate">{question.topic}</span>
          <span className="flex items-center gap-1.5 capitalize">
            <span
              aria-hidden="true"
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${DIFFICULTY_DOT[difficultyColor(question.difficulty)]}`}
            />
            {question.difficulty}
          </span>
        </div>
      </div>
    );
  }

  function renderFooterMeta() {
    const usageLabel = !answered
      ? t('questionBank.usedNever')
      : history.attempts === 1
        ? t('questionBank.usedOnce')
        : t('questionBank.usedMany', { count: history.attempts });

    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-400 font-semibold">
        <span>{question.sourceLabel}</span>
        <span>{usageLabel}</span>
        {answered && (
          <span>
            {t('questionBank.accuracyValue', {
              correct: history.correct,
              total: history.attempts,
              percent: history.accuracy,
            })}
          </span>
        )}
        <span>
          {t('questionBank.savedPrefix')} <RelativeDate date={question.createdAt} />
        </span>
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {answered ? (
          <>
            <Button
              aria-expanded={open}
              className={`${buttonStyles.flat} h-8 px-3 text-xs text-primary`}
              startContent={<FontAwesomeIcon aria-hidden="true" className="w-3 h-3" icon={faLightbulb} />}
              endContent={
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  icon={faChevronDown}
                />
              }
              size="sm"
              onPress={onToggleOpen}
            >
              {open ? t('questionBank.hideAnswer') : t('questionBank.showAnswer')}
            </Button>
          </>
        ) : (
          <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-dashed border-divider px-3 py-2 text-xs text-default-400">
            <FontAwesomeIcon aria-hidden="true" className="w-3 h-3" icon={faEyeSlash} />
            {t('questionBank.answerAfterResponding')}
          </span>
        )}
        <Button
          isIconOnly
          aria-label={t('questionBank.deleteQuestion')}
          className={buttonStyles.iconOnly.danger}
          data-testid="question-bank-delete-btn"
          size="sm"
          variant="light"
          onPress={onDeleteRequest}
        >
          <FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faTrash} />
        </Button>
      </div>
    );
  }

  function renderExpanded() {
    return (
      <motion.div
        key="expanded"
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        initial={{ height: 0, opacity: 0 }}
        style={{ overflow: 'hidden' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-2.5 px-5 pb-5 sm:pl-[62px]">
          <ul aria-label={t('browse.optionsSectionLabel')} className="flex flex-col gap-2">
            {Object.entries(question.options).map(([label, text]) => renderOption(label, text))}
          </ul>
          {hasExplanations ? renderExplanationBox() : renderNoExplanationBox()}
        </div>
      </motion.div>
    );
  }

  function renderOption(label: string, text: string) {
    const isCorrect = correctOptions.includes(label);
    const isMarkedWrong = !isCorrect && history.markedOptions.includes(label);

    const container = isCorrect
      ? 'bg-success/[0.07] border-success/35'
      : isMarkedWrong
        ? 'bg-danger/[0.07] border-danger/35'
        : 'bg-background border-content2';
    const badge = isCorrect
      ? 'bg-success text-background border-success'
      : isMarkedWrong
        ? 'bg-danger text-background border-danger'
        : 'bg-transparent text-default-500 border-divider';
    const suffix = isCorrect
      ? ` · ${t('questionBank.optionAnswerKey')}`
      : isMarkedWrong
        ? ` · ${t('questionBank.optionYourAnswer')}`
        : '';

    return (
      <li
        key={label}
        className={`grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3.5 rounded-lg border p-3 ${container}`}
      >
        <span
          className={`flex h-[26px] w-[26px] items-center justify-center rounded-md border font-mono text-[13px] ${badge}`}
        >
          {label}
        </span>
        <span className="pt-0.5 text-sm leading-snug text-foreground">
          {text}
          {suffix && <span className="text-default-400">{suffix}</span>}
        </span>
      </li>
    );
  }

  function renderExplanationBox() {
    return (
      <div className="mt-1.5 grid grid-cols-[20px_minmax(0,1fr)] items-start gap-3 rounded-lg bg-background p-4">
        <FontAwesomeIcon aria-hidden="true" className="mt-0.5 w-4 h-4 text-primary" icon={faLightbulb} />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-default-400">{t('questionBank.explanationTitle')}</span>
          {Object.entries(explanations).map(([label, text]) => (
            <p key={label} className="text-sm leading-relaxed text-foreground/90">
              <span className={`font-semibold ${correctOptions.includes(label) ? 'text-success' : 'text-default-400'}`}>
                {label} —{' '}
              </span>
              {text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  function renderNoExplanationBox() {
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-divider bg-background p-4">
        <FontAwesomeIcon aria-hidden="true" className="w-4 h-4 text-default-400" icon={faLightbulb} />
        <span className="text-sm text-default-500">{t('questionBank.noSavedExplanation')}</span>
        <Button
          className={`${buttonStyles.flat} ml-auto h-8 px-3 text-xs`}
          isLoading={isGeneratingExplanation}
          size="sm"
          onPress={onGenerateExplanation}
        >
          {t('questionBank.generateExplanation')}
        </Button>
      </div>
    );
  }
}
