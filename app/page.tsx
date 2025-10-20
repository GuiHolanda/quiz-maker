'use client';
import { useState } from 'react';
import { Card, CardHeader } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { title } from '@/components/primitives';
import { Question } from '@/types';
import { QuestionList } from '@/components/quiz/QuestionList';
import { QuestionareForm } from '@/components/quiz/QuestionareForm';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import useQuizContext from '@/features/hooks/useQuizContext.hook';

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);

  return (
    <CertificationsProvider>
      <QuizProvider>
        <QuizPageContent questions={questions} setQuestions={setQuestions} />
      </QuizProvider>
    </CertificationsProvider>
  );
}

interface QuizPageContentProps {
  questions: Question[] | null;
  setQuestions: (q: Question[]) => void;
}

function QuizPageContent({ questions, setQuestions }: Readonly<QuizPageContentProps>) {
  const { quiz, replaceQuiz } = useQuizContext();

  const onQuestionsGenerated = (questionsArr: Question[] | undefined) => {
    if (!questionsArr) return;
    replaceQuiz({
      meta: {
        topic: questionsArr[0]?.topic ?? '',
        num_questions: questionsArr.length,
      },
      questions: questionsArr,
      answers: {},
      isFinished: false,
    });
    setQuestions(questionsArr);
  };

  return (
    <>
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Generate your Quiz</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create personalized quizzes for your certifications practice
        </h3>
      </div>

      <Card className="w-full p-4">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-bold">Configure the questionaire</p>
          </div>
        </CardHeader>
        <Divider />
        <QuestionareForm onGenerated={onQuestionsGenerated} />
      </Card>

      {(quiz?.questions ?? questions) && <QuestionList questions={quiz?.questions ?? questions ?? []} />}
    </>
  );
}
