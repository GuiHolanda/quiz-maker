'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';

import { SimuladoResultQuestion } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ResultQuestionCardProps {
  readonly question: SimuladoResultQuestion;
  readonly selected: string[];
  readonly localIndex: number;
  readonly showDivider: boolean;
  readonly onLoadExplanation: (questionId: number) => Promise<Record<string, string>>;
}

export function ResultQuestionCard({
  question,
  selected,
  localIndex,
  showDivider,
  onLoadExplanation,
}: ResultQuestionCardProps) {
  const { t } = useTranslation();
  const correctOptions: string[] = question.answer?.correctOptions ?? [];
  const isCorrect =
    correctOptions.length > 0 &&
    selected.length === correctOptions.length &&
    selected.every((s) => correctOptions.includes(s));

  const [explanations, setExplanations] = useState<Record<string, string> | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasAnswer = !!question.answer;

  async function handleToggleExplanation() {
    if (explanations) {
      setShowExplanations((prev) => !prev);

      return;
    }
    setIsLoading(true);
    try {
      const data = await onLoadExplanation(question.id);

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
          {String(localIndex + 1).padStart(2, '0')}. {question.groupLabel}
        </p>
        <p className="text-sm font-bold text-foreground mb-4">{question.text}</p>

        <div className="flex flex-col gap-1.5">
          {Object.entries(question.options).map(([key, text]) => {
            const isSelected = selected.includes(key);
            const isCorrectOption = correctOptions.includes(key);

            let textClass = 'text-default-400';

            if (isSelected && isCorrectOption) textClass = 'text-success-500';
            else if (isSelected && !isCorrectOption) textClass = 'text-danger-500';
            else if (!isSelected && isCorrectOption && !isCorrect) textClass = 'text-foreground font-extrabold';

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
