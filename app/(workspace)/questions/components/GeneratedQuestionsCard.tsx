'use client';

import React, { useEffect } from 'react';
import { Checkbox } from '@heroui/checkbox';

import { AIQuestion } from '@/shared/types';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface QuestionCardProps {
  readonly question: AIQuestion;
  readonly index: number;
}

export function GeneratedQuestionsCard({ question, index }: QuestionCardProps) {
  const { state, setSelectedAIquestions } = useQuizContext();
  const [isSelected, setIsSelected] = React.useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!state?.selectedAIQuestions) {
      setIsSelected(false);

      return;
    }
    setIsSelected(state.selectedAIQuestions.includes(question.id));
  }, [state?.selectedAIQuestions, question.id]);

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;

    if (!state?.selectedAIQuestions) return;
    const selected = new Set(state.selectedAIQuestions);

    if (checked) {
      selected.add(question.id);
      setIsSelected(true);
    } else {
      selected.delete(question.id);
      setIsSelected(false);
    }
    setSelectedAIquestions(Array.from(selected));
  };

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 pb-3">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold text-foreground text-sm leading-relaxed">
            <span className="inline-block mr-2 text-default-400">{index + 1}.</span>
            {question.text}
          </h4>
          <Checkbox className="ml-auto flex-shrink-0" isSelected={isSelected} onChange={onCheckboxChange} />
        </div>
      </div>
      <div>
        <p className="text-default-400 text-xs font-semibold mb-2">
          {t(question.correctCount === 1 ? 'generate.correctAnswer' : 'generate.correctAnswers', {
            count: question.correctCount,
          })}
        </p>
        <ul className="flex flex-col gap-1 p-0 list-none">
          {Object.entries(question.options).map(([key, val]) => (
            <li key={key} className="rounded-lg px-3 py-2 text-sm text-default-600">
              <strong className="mr-2 text-primary">{key}.</strong>
              {val}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
