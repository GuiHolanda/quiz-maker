'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { AnswersMap } from '@/shared/types';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { SimuladoQuestionCard } from './SimuladoQuestionCard';

interface SimuladoQuestion {
  id: number;
  mockExamQuestionId: number;
  text: string;
  correctCount: number;
  subject: string;
  options: Record<string, string>;
}

interface SimuladoQuestionListProps {
  readonly questions: SimuladoQuestion[];
  readonly answers: AnswersMap;
  readonly onAnswerChange: (questionId: number, selected: string[]) => void;
  readonly onFinish: () => void;
}

export function SimuladoQuestionList({ questions, answers, onAnswerChange, onFinish }: SimuladoQuestionListProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);

  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const start = (currentPage - 1) * questionsPerPage;
  const pageQuestions = questions.slice(start, start + questionsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ItemsPerPageSelect
          value={questionsPerPage}
          onChange={(e) => {
            setQuestionsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        />
      </div>

      {pageQuestions.map((q) => (
        <SimuladoQuestionCard
          key={q.id}
          question={q}
          selectedOptions={answers[q.id] ?? []}
          onAnswerChange={(selected) => onAnswerChange(q.id, selected)}
        />
      ))}

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

      <Button color="danger" variant="flat" onPress={onFinish} className="w-full">
        {t('simulado.finalize')}
      </Button>
    </div>
  );
}
