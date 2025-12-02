import React from 'react';
import { AIQuestion } from '@/types';
import { Pagination } from '@heroui/pagination';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { GeneratedQuestionsCard } from './GeneratedQuestionsCard';
import { QUESTIONS_PER_PAGE_OPTIONS } from '@/config/constants';
import useQuizContext from '@/features/hooks/useQuizContext.hook';

export function AIQuestionList({
  questions,
}: Readonly<{
  questions: AIQuestion[];
}>) {
  const { state } = useQuizContext();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, endIndex);

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Number(e.target.value) || 1;
    const bounded = Math.max(1, Math.min(questions.length, v));
    setQuestionsPerPage(bounded);
    setCurrentPage(1);
  };

  const onSaveSelectedQuestions = () => {
    // No action needed, quiz will use selected questions
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-between">
        <h3 hidden={(state?.selectedAIQuestions?.length ?? 0) === 0} className="font-bold text-sm mt-auto">Selected questions: {state?.selectedAIQuestions?.length || 0}</h3>
        <div className="flex flex-col items-center gap-2 ml-auto">
          <label htmlFor="questionsPerPage" className="text-sm font-bold">
            Questions per page:
          </label>
          <Select
            id="questionsPerPage"
            defaultSelectedKeys={QUESTIONS_PER_PAGE_OPTIONS[1].key}
            items={QUESTIONS_PER_PAGE_OPTIONS}
            value={String(questionsPerPage)}
            onChange={onItemsPerPageChange}
            className="w-24 ml-auto"
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {visibleQuestions.length > 0 &&
          visibleQuestions.map((question, idx) => {
            const globalIndex = startIndex + idx;
            return (
              <GeneratedQuestionsCard
                key={`${question.topic}-${globalIndex}`}
                question={question}
                index={globalIndex}
              />
            );
          })}
      </div>

      <div className="flex gap-2">
        <Button
          color="primary"
          size="sm"
          variant="ghost"
          onPress={() => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))}
          isDisabled={currentPage === 1}
        >
          Previous
        </Button>
        <Pagination color="primary" page={currentPage} total={totalPages} onChange={setCurrentPage} />
        <Button
          color="primary"
          size="sm"
          variant="ghost"
          onPress={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
          isDisabled={currentPage === totalPages}
        >
          Next
        </Button>

        <Button
          className="ml-auto"
          variant="flat"
          color="primary"
          size="sm"
          onPress={onSaveSelectedQuestions}
          hidden={(state?.selectedAIQuestions?.length ?? 0) === 0}
        >
          Save Selected questions
        </Button>
      </div>
    </div>
  );
}
