'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion } from '@/shared/types';

interface DemoReviewQuestionProps {
  readonly question: DemoQuestion;
  readonly index: number;
  readonly totalQuestions: number;
  readonly selected: readonly number[];
  readonly isCorrect: boolean;
}

// Four mutually exclusive states an option can be in after grading.
function optionClass(isCorrectOption: boolean, isUserChoice: boolean): string {
  if (isCorrectOption && isUserChoice) return 'fb-ok-soft';
  if (isUserChoice) return 'fb-err-soft';
  return isCorrectOption ? 'fb-surface' : '';
}

export function DemoReviewQuestion({ question, index, totalQuestions, selected, isCorrect }: DemoReviewQuestionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-5 py-5 border-b border-mkt-divider last:border-b-0">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`mono text-xs px-2 py-0.5 border ${isCorrect ? 'fb-ok' : 'fb-err'}`}>
          {isCorrect ? '✓' : '✕'} {isCorrect ? t('demo.step4.reviewCorrect') : t('demo.step4.reviewWrong')}
        </span>
        <span className="mono text-xs text-mkt-text opacity-40">
          {t('demo.step4.reviewPageLabel', { n: index + 1, total: totalQuestions })}
        </span>
        <span className="mono text-xs text-mkt-accent border border-mkt-accent/30 px-2 py-0.5 ml-auto">
          {question.topic}
        </span>
      </div>

      <p className="text-base text-mkt-text mb-4">{question.text}</p>

      <div className="space-y-1.5 mb-4">
        {question.options.map((option, optionIndex) => {
          const isCorrectOption = question.correctIndexes.includes(optionIndex);
          const isUserChoice = selected.includes(optionIndex);
          const isDimmed = !isCorrectOption && !isUserChoice;

          return (
            <div
              key={optionIndex}
              className={`border border-mkt-divider px-3 py-2.5 text-sm flex items-start gap-3 ${optionClass(isCorrectOption, isUserChoice)}`}
            >
              <span className="mono text-xs text-mkt-text opacity-40 flex-shrink-0 mt-0.5">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className={`flex-1 text-mkt-text ${isDimmed ? 'opacity-30' : ''}`}>{option}</span>
              {isCorrectOption && !isUserChoice && (
                <span className="mono text-xs text-mkt-text opacity-50 flex-shrink-0">
                  {t('demo.step4.reviewCorrectAnswer')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className={`px-4 py-3 text-sm text-mkt-text border-l-2 ${isCorrect ? 'fb-rule-ok' : 'fb-rule-err'}`}>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
