'use client';
import { useState } from 'react';
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
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <div className="flex flex-col mb-8 gap-1.5">
          <h1 className="page-header-title">Generate your Quiz</h1>
          <p className="page-header-subtitle">
            Create personalized quizzes for your certifications practice
          </p>
        </div>

        <QuizForm onGenerated={onQuestionsGenerated} />

        {(quiz?.questions ?? questions) && <QuestionList questions={quiz?.questions ?? questions ?? []} />}
      </div>
    </div>
  );
}
