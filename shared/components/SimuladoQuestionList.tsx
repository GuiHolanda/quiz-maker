'use client';

import React, { useCallback } from 'react';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Tooltip } from '@heroui/tooltip';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AnswersMap, SimuladoQuestion } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { QuestionCard } from '@/shared/components/QuestionCard';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
  const [draftAnswers, setDraftAnswers] = React.useState<AnswersMap>({});

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

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
  const confirmedCount = answeredCount - pendingQuestions.length;
  const canFinish = allAnswered && !hasPending;

  const handleAnswerChange = useCallback(
    (questionId: number, value: string | string[]) => {
      const arr = Array.isArray(value) ? value : [value];

      onAnswerChange(questionId, arr);
      setDraftAnswers((prev) => {
        const next = { ...prev };

        delete next[questionId];

        return next;
      });
    },
    [onAnswerChange]
  );

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
          className="flex-1"
          content={
            <div className="flex flex-col gap-1 py-1">
              <p className="text-xs font-semibold text-warning">{t('simulado.finalizeBlocked')}</p>
              <p className="text-xs text-default-400">
                {pendingQuestions.map(({ globalIndex }) => `Q${globalIndex}`).join(', ')}
              </p>
            </div>
          }
          isDisabled={!hasPending}
          placement="bottom-start"
        >
          <Progress
            showValueLabel
            aria-label={t('aria.quizProgress')}
            className="flex-1"
            classNames={{ label: 'text-sm font-bold pl-2', value: 'text-sm font-bold' }}
            color={hasPending ? 'warning' : 'primary'}
            formatOptions={undefined}
            label={t('quiz.questionsAnswered')}
            maxValue={questions.length}
            size="md"
            value={confirmedCount}
            valueLabel={t('simulado.progress', { answered: confirmedCount, total: questions.length })}
          />
        </Tooltip>
        <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} />
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.map((question, i) => (
          <QuestionCard
            key={question.id}
            draftValue={draftAnswers[question.id]}
            index={startIndex + i + 1}
            initialValue={answers[question.id]}
            question={question}
            onAnswerChange={handleAnswerChange}
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
            <Button className={buttonStyles.dangerFlat} isDisabled={!canFinish} size="sm" onPress={onFinish}>
              {t('simulado.finalize')}
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
