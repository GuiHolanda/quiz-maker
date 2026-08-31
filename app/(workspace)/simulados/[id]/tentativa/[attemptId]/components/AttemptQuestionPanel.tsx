'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faFlag, faForwardStep } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { AttemptQuestion } from './useAttemptRunner.hook';

interface AttemptQuestionPanelProps {
  readonly question: AttemptQuestion;
  readonly index: number;
  readonly total: number;
  readonly topic: string;
  readonly selected: string[];
  readonly multi: boolean;
  readonly answeredCount: number;
  readonly openCount: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onSelect: (optionKey: string) => void;
  readonly onPrev: () => void;
  readonly onSkip: () => void;
  readonly onNext: () => void;
}

export function AttemptQuestionPanel({
  question,
  index,
  total,
  topic,
  selected,
  multi,
  answeredCount,
  openCount,
  isFirst,
  isLast,
  onSelect,
  onPrev,
  onSkip,
  onNext,
}: AttemptQuestionPanelProps) {
  const { t } = useTranslation();
  const options = Object.entries(question.options);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-divider bg-content2 px-3 py-1.5 font-mono text-xs text-default-500">
            {t('simulado.attempt.questionCounter', { current: index, total })}
          </span>
          {topic && <span className="text-xs text-default-400">{topic}</span>}
        </div>
        <span className="text-xs text-default-400">
          {t('simulado.attempt.answeredOpen', { answered: answeredCount, open: openCount })}
        </span>
      </div>

      <div className="attempt-question-enter rounded-xl border border-divider bg-content1 p-6 md:p-8">
        <p className="text-lg text-foreground text-pretty">{question.text}</p>
        {multi && (
          <p className="mt-2 text-xs text-default-400">
            {t('simulado.attempt.selectN', { count: question.correctCount })}
          </p>
        )}

        <div
          className="mt-6 flex flex-col gap-3"
          role={multi ? undefined : 'radiogroup'}
          aria-label={multi ? undefined : t('aria.options')}
        >
          {options.map(([key, label]) => {
            const isSelected = selected.includes(key);
            const roleProps = multi ? { 'aria-pressed': isSelected } : { role: 'radio', 'aria-checked': isSelected };
            return (
              <button
                key={key}
                className={`grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-4 rounded-lg border px-4 py-4 text-left transition-colors duration-200 ${
                  isSelected ? 'border-primary bg-primary/[0.06]' : 'border-divider hover:border-primary/60'
                }`}
                data-testid="attempt-option"
                type="button"
                onClick={() => onSelect(key)}
                {...roleProps}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-md border font-mono text-sm ${
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-divider text-default-500'
                  }`}
                >
                  {key}
                </span>
                <span
                  className={`pt-1 text-sm leading-relaxed text-pretty ${
                    isSelected ? 'text-foreground' : 'text-default-600'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          className={buttonStyles.secondary}
          data-testid="attempt-prev-btn"
          isDisabled={isFirst}
          size="sm"
          startContent={<FontAwesomeIcon icon={faChevronLeft} />}
          variant="bordered"
          onPress={onPrev}
        >
          {t('simulado.attempt.previous')}
        </Button>
        <div className="flex gap-2">
          <Button
            className={buttonStyles.secondary}
            data-testid="attempt-skip-btn"
            size="sm"
            startContent={<FontAwesomeIcon icon={faForwardStep} />}
            variant="bordered"
            onPress={onSkip}
          >
            {t('simulado.attempt.skip')}
          </Button>
          <Button
            className={buttonStyles.primary}
            data-testid="attempt-next-btn"
            endContent={<FontAwesomeIcon icon={isLast ? faFlag : faChevronRight} />}
            size="sm"
            onPress={onNext}
          >
            {isLast ? t('simulado.attempt.reviewAndFinish') : t('simulado.attempt.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
