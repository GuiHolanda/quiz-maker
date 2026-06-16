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
  // draftAnswers keeps unsaved selections so they survive page changes
  const [draftAnswers, setDraftAnswers] = React.useState<AnswersMap>({});

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // Questions with unsaved selection changes (draft differs from saved)
  const pendingQuestions = questions
    .map((q, i) => ({ q, globalIndex: i + 1 }))
    .filter(({ q }) => {
      const draft = draftAnswers[q.id];
      const saved = answers[q.id];
      if (!draft || draft.length === 0) return false;
      if (!saved || saved.length === 0) return false;
      return draft.length !== saved.length || draft.some((v, idx) => v !== saved[idx]);
    });

  const hasPending = pendingQuestions.length > 0;
  // Confirmed = saved answers minus those with unsaved changes
  const confirmedCount = answeredCount - pendingQuestions.length;
  const canFinish = allAnswered && !hasPending;

  const handleAnswerChange = useCallback((questionId: number, value: string | string[]) => {
    const arr = Array.isArray(value) ? value : [value];
    onAnswerChange(questionId, arr);
    // Clear draft for this question — it is now saved
    setDraftAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, [onAnswerChange]);

  const handleSelectionChange = useCallback((questionId: number, selection: string[]) => {
    setDraftAnswers((prev) => ({ ...prev, [questionId]: selection }));
  }, []);

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Math.max(1, Math.min(questions.length, Number(e.target.value) || 1));
    setQuestionsPerPage(v);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-end justify-between gap-4">
        <Tooltip
          isDisabled={!hasPending}
          content={
            <div className="flex flex-col gap-1 py-1">
              <p className="text-xs font-semibold text-warning">{t('simulado.finalizeBlocked')}</p>
              <p className="text-xs text-default-400">
                {pendingQuestions.map(({ globalIndex }) => `Q${globalIndex}`).join(', ')}
              </p>
            </div>
          }
          placement="bottom-start"
          className="flex-1"
        >
          <Progress
            aria-label={t('aria.quizProgress')}
            label={t('quiz.questionsAnswered')}
            classNames={{ label: 'text-sm font-bold pl-2', value: 'text-sm font-bold' }}
            valueLabel={t('simulado.progress', { answered: confirmedCount, total: questions.length })}
            formatOptions={undefined}
            color={hasPending ? 'warning' : 'primary'}
            showValueLabel
            size="md"
            value={confirmedCount}
            maxValue={questions.length}
            className="flex-1"
          />
        </Tooltip>
        <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} />
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            onAnswerChange={handleAnswerChange}
            initialValue={answers[question.id]}
            draftValue={draftAnswers[question.id]}
            index={startIndex + i + 1}
            onSelectionChange={handleSelectionChange}
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
