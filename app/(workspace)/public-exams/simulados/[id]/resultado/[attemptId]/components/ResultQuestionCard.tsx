'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';

import { MockExamQuestion } from '@/shared/types';
import { getQuestionExplanation } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ResultQuestionCardProps {
  readonly mq: MockExamQuestion;
  readonly selected: string[];
  readonly localIndex: number;
  readonly showDivider: boolean;
}

export function ResultQuestionCard({ mq, selected, localIndex, showDivider }: ResultQuestionCardProps) {
  const { t } = useTranslation();
  const options = mq.publicExamQuestion.options as Record<string, string>;
  const correctOptions: string[] = (mq.publicExamQuestion.answer?.correctOptions as string[]) ?? [];
  const isCorrect =
    correctOptions.length > 0 &&
    selected.length === correctOptions.length &&
    selected.every((s) => correctOptions.includes(s));

  const initialExplanations =
    mq.publicExamQuestion.answer?.explanations && Object.keys(mq.publicExamQuestion.answer.explanations).length > 0
      ? (mq.publicExamQuestion.answer.explanations as Record<string, string>)
      : null;

  const [explanations, setExplanations] = useState<Record<string, string> | null>(initialExplanations);
  const [showExplanations, setShowExplanations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasAnswer = !!mq.publicExamQuestion.answer;

  async function handleToggleExplanation() {
    if (explanations) {
      setShowExplanations((prev) => !prev);

      return;
    }
    setIsLoading(true);
    try {
      const data = await getQuestionExplanation(mq.publicExamQuestion.id);

      setExplanations(data);
      setShowExplanations(true);
    } catch {
      // silently fail — button stays available for retry
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {showDivider && <div className="border-t border-default-100" />}
      <div className={`rounded-xl p-4 ${isCorrect ? 'bg-success-200/20' : 'bg-danger-400/20'}`}>
        <p className="text-xs mb-1">
          {String(localIndex + 1).padStart(2, '0')}. {mq.publicExamQuestion.subject}
        </p>
        <p className="text-sm font-bold text-foreground mb-4">{mq.publicExamQuestion.text}</p>

        <div className="flex flex-col gap-1.5">
          {Object.entries(options).map(([key, text]) => {
            const isSelected = selected.includes(key);
            const isCorrectOption = correctOptions.includes(key);

            let textClass = 'text-default-400';

            if (isSelected && isCorrect) textClass = 'text-success-500';
            else if (isSelected && !isCorrect) textClass = 'text-danger-500';
            else if (!isSelected && isCorrectOption && !isCorrect) textClass = 'text-success-500';

            return (
              <p key={key} className={`text-xs ${textClass} font-extrabold`}>
                <span className="font-bold">{key})</span> {text}
              </p>
            );
          })}

          {hasAnswer && (
            <div className="mt-2">
              <Button
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 rounded-lg transition-colors text-xs h-7 px-3"
                isLoading={isLoading}
                size="sm"
                variant="flat"
                onPress={handleToggleExplanation}
              >
                {showExplanations ? t('simulado.hideExplanation') : t('simulado.viewExplanation')}
              </Button>

              {showExplanations && explanations && (
                <div className="mt-2 border-t border-default-100 pt-2 flex flex-col gap-1">
                  {Object.entries(explanations).map(([label, text]) => (
                    <p key={label} className="text-xs text-default-500">
                      <span className="font-semibold">{label})</span> {text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
