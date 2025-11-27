import React from 'react';
import { AIQuestion, AnswersMap } from '@/types';
import { Pagination } from '@heroui/pagination';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { GeneratedQuestionsCard } from './GeneratedQuestionsCard';

export function AIQuestionList({
  questions,
}: Readonly<{
  questions: AIQuestion[];
}>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const { quiz, setAnswers, setFinished } = useQuizContext();
  const answers: AnswersMap = quiz?.answers ?? {};

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    const arr = Array.isArray(value) ? value : [value];
    const newAnswers = { ...(quiz?.answers || {}), [questionId]: arr } as AnswersMap;

    setAnswers(newAnswers);

    if (currentPage < questions.length) setCurrentPage((i) => i + 1);
  };

  const onFinishQuiz = () => {
    setFinished(true);
    setCurrentPage(1);
  };

  const onRestartQuiz = () => {
    setFinished(false);
    setAnswers({});
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <Progress
        aria-label="Quiz Progress"
        label="Questions answered"
        classNames={{ label: 'text-sm font-bold pl-2', value: 'text-sm font-bold' }}
        valueLabel={`${answers ? Object.keys(answers).length : 0} of ${questions.length}`}
        formatOptions={undefined}
        color="primary"
        showValueLabel={true}
        size="md"
        value={answers ? Object.keys(answers).length : 0}
        maxValue={questions.length}
      />
      <div className="flex flex-col gap-3">
        {questions.length > 0 && questions.map((question, index) => (
          <GeneratedQuestionsCard
            key={`${question.topic}-${index}`}
            question={question}
            index={index}
          />
        ))}
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
        <Pagination color="primary" page={currentPage} total={questions.length} onChange={setCurrentPage} />
        <Button
          color="primary"
          size="sm"
          variant="ghost"
          onPress={() => setCurrentPage((prev) => (prev < questions.length ? prev + 1 : prev))}
          isDisabled={currentPage === questions.length}
        >
          Next
        </Button>

        <Button
          className="ml-auto"
          variant="flat"
          color="primary"
          size="sm"
          onPress={quiz?.isFinished ? onRestartQuiz : onFinishQuiz}
          hidden={Object.keys(answers).length !== questions.length}
        >
          {quiz?.isFinished ? 'Restart Quiz' : 'Finish Quiz'}
        </Button>
      </div>
    </div>
  );
}
