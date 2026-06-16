'use client';

import { MockExamQuestion } from '@/shared/types';

interface ResultQuestionCardProps {
  readonly mq: MockExamQuestion;
  readonly selected: string[];
  readonly localIndex: number;
  readonly showDivider: boolean;
}

export function ResultQuestionCard({ mq, selected, localIndex, showDivider }: ResultQuestionCardProps) {
  const options = mq.publicExamQuestion.options as Record<string, string>;
  const correctOptions: string[] = (mq.publicExamQuestion.answer?.correctOptions as string[]) ?? [];
  const isCorrect =
    correctOptions.length > 0 &&
    selected.length === correctOptions.length &&
    selected.every((s) => correctOptions.includes(s));

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

          {mq.publicExamQuestion.answer?.explanations &&
            Object.keys(mq.publicExamQuestion.answer.explanations).length > 0 && (
              <div className="mt-1 border-t border-default-100 pt-2">
                {Object.entries(mq.publicExamQuestion.answer.explanations).map(([label, text]) => (
                  <p key={label} className="text-xs text-default-500">
                    <span className="font-semibold">{label})</span> {text as string}
                  </p>
                ))}
              </div>
            )}
        </div>
      </div>
    </>
  );
}
