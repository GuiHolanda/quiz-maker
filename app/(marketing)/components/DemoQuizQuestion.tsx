'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion } from '@/shared/types';

interface DemoQuizQuestionProps {
  readonly question: DemoQuestion;
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly selectedIndex: number | null;
  readonly onSelect: (index: number) => void;
  readonly onNext: () => void;
  readonly isLast: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export function DemoQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelect,
  onNext,
  isLast,
}: DemoQuizQuestionProps) {
  const { t } = useTranslation();
  const answered = selectedIndex !== null;
  const progressPct = Math.round((questionNumber / totalQuestions) * 100);

  function getOptionClassName(index: number): string {
    const base =
      'w-full text-left flex items-start gap-3 px-4 py-3 border text-sm transition-colors duration-150 cursor-pointer';

    if (!answered) {
      return `${base} border-mkt-divider bg-mkt-surface hover:border-mkt-accent text-mkt-text`;
    }

    const isCorrect = index === question.correctIndex;
    const isSelectedWrong = index === selectedIndex && index !== question.correctIndex;

    if (isCorrect) return `${base} border-mkt-accent bg-mkt-accent-100 text-mkt-text`;
    if (isSelectedWrong) return `${base} border-mkt-text/40 bg-mkt-surface text-mkt-text`;
    return `${base} border-mkt-divider bg-mkt-surface text-mkt-text opacity-60`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="mono text-xs text-mkt-text opacity-60">
          {t('landing.demo.questionOf', { current: String(questionNumber), total: String(totalQuestions) })}
        </span>
        <span className="mono text-xs text-mkt-text opacity-60">{progressPct}%</span>
      </div>
      <div className="h-1 w-full bg-mkt-surface mb-6">
        <div className="h-1 bg-mkt-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mb-4">
        <span className="kick">{question.topic}</span>
      </div>

      <p className="text-base text-mkt-text leading-relaxed mb-6">{question.text}</p>

      <div className="flex flex-col gap-2 mb-6">
        {question.options.map((option, index) => {
          const isCorrect = answered && index === question.correctIndex;
          const isSelectedWrong = answered && index === selectedIndex && index !== question.correctIndex;

          return (
            <button
              key={index}
              className={getOptionClassName(index)}
              disabled={answered}
              onClick={() => !answered && onSelect(index)}
            >
              <span className="mono text-xs font-bold shrink-0 mt-0.5 w-4">{OPTION_LABELS[index]}</span>
              <span className="flex-1">{option}</span>
              {isCorrect && (
                <span className="shrink-0 inline-flex items-center gap-1.5 mt-0.5">
                  <FontAwesomeIcon className="text-mkt-accent text-xs" icon={faCheck} />
                  <span className="kick">{t('landing.demo.correct')}</span>
                </span>
              )}
              {isSelectedWrong && (
                <span className="shrink-0 mt-0.5 mono text-[10px] uppercase tracking-widest text-mkt-text opacity-50">
                  {t('landing.demo.yourAnswer')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="bg-mkt-surface border border-mkt-divider p-4 mb-6">
          <p className="text-sm text-mkt-text opacity-60 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {answered && (
        <Button
          className="w-full font-semibold text-sm bg-mkt-accent text-white hover:opacity-90"
          radius="none"
          size="lg"
          onPress={onNext}
        >
          {isLast ? t('landing.demo.seeResults') : t('landing.demo.next')}
        </Button>
      )}
    </div>
  );
}
