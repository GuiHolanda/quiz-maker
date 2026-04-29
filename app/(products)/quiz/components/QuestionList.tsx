import React from 'react';
import { AnswersMap, StoredQuestion } from '@/shared/types';
import { QuestionCard } from './QuestionCard';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { AnsweredQuestionCard } from './AnswredQuestionCard';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function QuestionList({
  questions,
}: Readonly<{
  questions: StoredQuestion[];
}>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [questionsPerPage, setQuestionsPerPage] = React.useState<number>(5);
  const { state: quiz, setAnswers, setFinished } = useQuizContext();
  const { t } = useTranslation();
  const answers: AnswersMap = quiz?.answers ?? {};

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));
  const startIndex = (currentPage - 1) * questionsPerPage;
  const visibleQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    const arr = Array.isArray(value) ? value : [value];
    const newAnswers = { ...(quiz?.answers || {}), [questionId]: arr } as AnswersMap;

    setAnswers(newAnswers);

    if (questionsPerPage === 1 && currentPage < totalPages) setCurrentPage((i) => i + 1);
  };

  const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = Number(e.target.value) || 1;
    const bounded = Math.max(1, Math.min(questions.length, v));
    setQuestionsPerPage(bounded);
    setCurrentPage(1);
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
      {questions.length > 0 && (
        <>
          <div className="flex items-end justify-between">
            <Progress
              aria-label={t('aria.quizProgress')}
              label={t('quiz.questionsAnswered')}
              classNames={{ label: 'text-sm font-bold pl-2', value: 'text-sm font-bold' }}
              valueLabel={t('quiz.progress', { answered: Object.keys(answers).length, total: questions.length })}
              formatOptions={undefined}
              color="primary"
              showValueLabel={true}
              size="md"
              value={Object.keys(answers).length}
              maxValue={questions.length}
              className="flex-1"
            />
          </div>
          <div className="flex flex-col gap-3">
            {visibleQuestions.map((question) =>
              !quiz?.isFinished ? (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onAnswerChange={handleAnswerChange}
                  initialValue={answers[question.id]}
                />
              ) : (
                <AnsweredQuestionCard key={question.id} question={question} answer={answers[question.id]} />
              )
            )}
          </div>
          <div className="flex gap-2 items-end">
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
            <ItemsPerPageSelect value={questionsPerPage} onChange={onItemsPerPageChange} />
            <Button
              className="ml-auto"
              variant="flat"
              color="primary"
              size="sm"
              onPress={quiz?.isFinished ? onRestartQuiz : onFinishQuiz}
              hidden={Object.keys(answers).length !== questions.length}
            >
              {quiz?.isFinished ? t('quiz.restartQuiz') : t('quiz.finishQuiz')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
