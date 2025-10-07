import React from "react";
import { AnswersMap, Question } from "@/types";
import { useQuizStore } from "@/features/useQuizStore.hook";
import { QuestionCard } from "./QuestionCard";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";

export function QuestionList({
  questions,
  onFinish,
}: Readonly<{
  questions: Question[];
  onFinish?: (answers: Record<number, string[]>) => void;
}>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const { quiz, setAnswers } = useQuizStore();
  const answers: AnswersMap = quiz?.answers ?? {};

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    const arr = Array.isArray(value) ? value : [value];
    const newAnswers = { ...(quiz?.answers || {}), [questionId]: arr } as AnswersMap;

    setAnswers(newAnswers);

    if (currentPage < questions.length) setCurrentPage((i) => i + 1);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <Progress
        aria-label="Quiz Progress"
        label="Questions answered"
        classNames={{ label: "text-sm font-bold" , value: "text-sm font-bold"}}
        valueLabel={`${answers ? Object.keys(answers).length : 0} of ${questions.length}`}
        formatOptions={undefined}
        color="primary"
        showValueLabel={true}
        size="md"
        value={answers ? Object.keys(answers).length : 0}
        maxValue={ questions.length }
      />
      <div className="flex flex-col gap-3">
        {questions.length > 0 && (
          <QuestionCard
            key={questions[currentPage - 1].id}
            question={questions[currentPage - 1]}
            onAnswerChange={handleAnswerChange}
            initialValue={answers[questions[currentPage - 1].id]}
          />
        )}
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
        <Pagination
          color="primary"
          page={currentPage}
          total={questions.length}
          onChange={setCurrentPage}
        />
        <Button
          color="primary"
          size="sm"
          variant="ghost"
          onPress={() =>
            setCurrentPage((prev) => (prev < 10 ? prev + 1 : prev))
          }
          isDisabled={currentPage === questions.length}
        >
          Next
        </Button>

        <Button
        className="ml-auto"
          variant="flat"
          color="primary"
          size="sm"
          onPress={() => onFinish?.(answers)}
          hidden={Object.keys(answers).length !== questions.length}
        >
          Finish Quiz
        </Button>
      </div>
    </div>
  );
}
