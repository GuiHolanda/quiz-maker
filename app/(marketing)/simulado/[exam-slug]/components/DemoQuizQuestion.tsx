'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
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
    const base = 'w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-colors duration-150 cursor-pointer';

    if (!answered) {
      return `${base} border-divider bg-content2 hover:bg-default-100 text-foreground`;
    }

    const isCorrect = index === question.correctIndex;
    const isSelected = index === selectedIndex;

    if (isCorrect) return `${base} border-success/50 bg-success/10 text-success`;
    if (isSelected) return `${base} border-danger/50 bg-danger/10 text-danger`;
    return `${base} border-divider bg-transparent text-default-400`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-default-500">
          {t('landing.demo.questionOf', { current: String(questionNumber), total: String(totalQuestions) })}
        </span>
        <span className="font-mono text-xs text-default-500">{progressPct}%</span>
      </div>
      <div className="h-1 w-full bg-content2 rounded-full mb-6">
        <div
          className="h-1 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mb-4">
        <span className="font-mono text-xs text-default-500 uppercase tracking-widest">{question.topic}</span>
      </div>

      <p className="text-base text-foreground leading-relaxed mb-6">{question.text}</p>

      <div className="space-y-2 mb-6">
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
              <span className="font-mono text-xs font-bold shrink-0 mt-0.5 w-4">
                {OPTION_LABELS[index]}
              </span>
              <span className="flex-1">{option}</span>
              {isCorrect && <FontAwesomeIcon className="text-success text-xs shrink-0 mt-0.5" icon={faCheck} />}
              {isSelectedWrong && <FontAwesomeIcon className="text-danger text-xs shrink-0 mt-0.5" icon={faXmark} />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="bg-content2 border border-divider rounded-lg p-4 mb-6">
          <p className="text-sm text-default-500 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {answered && (
        <Button
          className="w-full font-semibold text-sm bg-primary text-white rounded"
          size="lg"
          onPress={onNext}
        >
          {isLast ? t('landing.demo.seeResults') : t('landing.demo.next')}
        </Button>
      )}
    </div>
  );
}
