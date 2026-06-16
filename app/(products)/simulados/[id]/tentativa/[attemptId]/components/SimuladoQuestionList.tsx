'use client';

import React, { useCallback } from 'react';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Tooltip } from '@heroui/tooltip';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AnswersMap } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { QuestionCard } from '@/shared/components/QuestionCard';

interface SimuladoQuestion {
  readonly id: number;
  readonly mockExamQuestionId: number;
  readonly text: string;
  readonly correctCount: number;
  readonly options: Record<string, string>;
}

interface SimuladoQuestionListProps {
  readonly questions: SimuladoQuestion[];
  readonly answers: AnswersMap;
  readonly onAnswerChange: (questionId: number, selected: string[]) => void;
  readonly onFinish: () => void;
}

export function SimuladoQuestionList({ questions, answers, onAnswerChange, onFinish }: SimuladoQuestionListProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);
  const [pendingSet, setPendingSet] = React.useState<Set<number>>(new Set());

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const hasPending = pendingSet.size > 0;
  const canFinish = allAnswered && !hasPending;

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    const arr = Array.isArray(value) ? value : [value];
    onAnswerChange(questionId, arr);
    if (questionsPerPage === 1 && currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handlePendingChange = useCallback((questionId: number, hasPendingChange: boolean) => {
    setPendingSet((prev) => {
      const next = new Set(prev);
      if (hasPendingChange) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Math.max(1, Math.min(questions.length, Number(e.target.value) || 1));
    setQuestionsPerPage(v);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-end justify-between gap-4">
        <Progress
          aria-label={t('aria.quizProgress')}
          label={t('quiz.questionsAnswered')}
          classNames={{ label: 'text-sm font-bold pl-2', value: 'text-sm font-bold' }}
          valueLabel={t('simulado.progress', { answered: answeredCount, total: questions.length })}
          formatOptions={undefined}
          color="primary"
          showValueLabel
          size="md"
          value={answeredCount}
          maxValue={questions.length}
          className="flex-1"
        />
        <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} />
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            onAnswerChange={handleAnswerChange}
            initialValue={answers[question.id]}
            index={startIndex + i + 1}
            onPendingChange={handlePendingChange}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        <Tooltip
          content={
            !allAnswered
              ? t('simulado.progress', { answered: answeredCount, total: questions.length })
              : hasPending
                ? t('simulado.finalizeBlocked')
                : undefined
          }
          isDisabled={canFinish}
        >
          <span className="ml-auto">
            <Button
              variant="flat"
              color="danger"
              size="sm"
              onPress={onFinish}
              isDisabled={!canFinish}
            >
              {t('simulado.finalize')}
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
