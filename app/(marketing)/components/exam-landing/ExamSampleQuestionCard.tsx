'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';
import { demoHrefForSlug } from '@/config/demo-links';
import { DEMO_QUIZ_SIZE } from '@/config/constants';

import { useExamPractice } from './ExamPracticeContext';

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
const BOOLEAN_LETTERS = ['V', 'F'] as const;

interface ExamSampleQuestionCardProps {
  readonly config: ExamLandingConfig;
}

export function ExamSampleQuestionCard({ config }: ExamSampleQuestionCardProps) {
  const { t } = useTranslation();
  const { question, pickedIndex, pickOption, nextQuestion } = useExamPractice();

  const isRevealed = pickedIndex !== null;
  const isCorrect = pickedIndex === question.answerIndex;
  const letterAt = (index: number) => (question.options.length === 2 ? BOOLEAN_LETTERS[index] : LETTERS[index]);

  return (
    <BlueprintFrame className="bg-mkt-bg self-start">
      <div className="flex items-center justify-between px-5 py-3 border-b border-mkt-divider">
        <span className="kick">{t('landing.sample.panelLabel', { name: config.name })}</span>
        <span className="mono text-[11px] text-mkt-text opacity-55">
          {isRevealed ? t('landing.sample.panelCorrected') : t('landing.sample.panelFree')}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4 text-xs text-mkt-text opacity-60">
          <span>{t('landing.sample.topicLabel')}</span>
          <span className="mono text-right">{question.topic}</span>
        </div>

        <div className="mt-3.5 p-4 bg-mkt-surface border border-mkt-divider">
          <span className="kick mb-2">{t('landing.sample.tag', { name: config.name, topic: question.topic })}</span>
          <p className="text-[15px] font-medium leading-relaxed text-mkt-text text-pretty">{question.stem}</p>

          <div className="flex flex-col gap-1.5 mt-3">
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={pickedIndex === index}
                className={`flex items-center justify-between gap-2.5 text-left text-sm px-3 py-2.5 border transition-colors ${optionClasses(
                  { isRevealed, isAnswer: index === question.answerIndex, isPicked: pickedIndex === index }
                )}`}
                onClick={() => pickOption(index)}
              >
                <span>
                  {letterAt(index)} · {option}
                </span>
                {isRevealed && index === question.answerIndex && (
                  <span className="mono text-[11px] text-mkt-accent-800 shrink-0">
                    {t('landing.sample.correctMark')}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isRevealed && (
            <p className="mt-3 pt-2.5 border-t border-mkt-divider text-xs leading-relaxed text-mkt-text opacity-75 text-pretty">
              <strong className="font-semibold">
                {isCorrect
                  ? t('landing.sample.verdictCorrect')
                  : t('landing.sample.verdictAnswer', { letter: letterAt(question.answerIndex) })}
                {' · '}
              </strong>
              {question.explanation}
            </p>
          )}
        </div>

        <NextLink
          className="flex items-center justify-center w-full mt-4 px-4 py-3.5 text-[15px] font-semibold bg-mkt-accent text-white hover:opacity-90 transition-opacity"
          href={demoHrefForSlug(config.slug)}
        >
          {t('landing.hero.ctaPrimary', { count: DEMO_QUIZ_SIZE, name: config.name })}
        </NextLink>

        <button
          type="button"
          className="w-full mt-2 px-4 py-2.5 text-[13px] border border-mkt-divider text-mkt-text opacity-70 hover:opacity-100 transition-opacity"
          onClick={nextQuestion}
        >
          {t('landing.sample.another')}
        </button>
      </div>
    </BlueprintFrame>
  );
}

interface OptionState {
  readonly isRevealed: boolean;
  readonly isAnswer: boolean;
  readonly isPicked: boolean;
}

// The wrong pick is marked in neutral ink rather than red: it flags what the
// visitor chose, and the explanation right below carries the correction.
function optionClasses({ isRevealed, isAnswer, isPicked }: OptionState): string {
  if (!isRevealed) return 'bg-mkt-bg border-mkt-divider hover:border-mkt-accent cursor-pointer';
  if (isAnswer) return 'bg-mkt-accent-100 border-mkt-accent cursor-default';
  if (isPicked) return 'bg-mkt-surface border-mkt-text/45 cursor-default';
  return 'bg-mkt-bg border-mkt-divider opacity-60 cursor-default';
}
