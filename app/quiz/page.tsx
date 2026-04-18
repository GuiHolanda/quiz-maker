'use client';
import { useState } from 'react';
import { title } from '@/sharedComponents/primitives';
import { StoredQuestion } from '@/types';
import { QuestionList } from '@/app/quiz/components/QuestionList';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { QuizForm } from '@/app/quiz/components/QuizForm';

export default function QuizPage() {
  const [questions, setQuestions] = useState<StoredQuestion[] | null>(null);

  return (
    <CertificationsProvider>
      <QuizProvider>
        <QuizPageContent questions={questions} setQuestions={setQuestions} />
      </QuizProvider>
    </CertificationsProvider>
  );
}

interface QuizPageContentProps {
  questions: StoredQuestion[] | null;
  setQuestions: (q: StoredQuestion[]) => void;
}

function QuizPageContent({ questions, setQuestions }: Readonly<QuizPageContentProps>) {
  const { state: quiz, replaceQuiz } = useQuizContext();

  const onQuestionsGenerated = (questionsArr: StoredQuestion[] | undefined) => {
    if (!questionsArr) return;
    replaceQuiz({
      meta: {
        topic: questionsArr[0]?.topic ?? '',
        num_questions: questionsArr.length,
      },
      aiQuestions: [],
      selectedAIQuestions: null,
      questions: questionsArr,
      answers: {},
      isFinished: false,
    });
    setQuestions(questionsArr);
  };

  return (
    <div className="container mx-auto max-w-7xl pt-6 px-6">
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Generate your Quiz</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create personalized quizzes for your certifications practice
        </h3>
      </div>

      <QuizForm onGenerated={onQuestionsGenerated} />

      {(quiz?.questions ?? questions) && <QuestionList questions={quiz?.questions ?? questions ?? []} />}
    </div>
  );
}
