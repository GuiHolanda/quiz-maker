'use client';
import { useState } from 'react';
import { StoredQuestion } from '@/shared/types';
import { QuestionList } from '@/app/(products)/quiz/components/QuestionList';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { QuizForm } from '@/app/(products)/quiz/components/QuizForm';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';

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
  const { t } = useTranslation();
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
    <PageHeader title={t('quiz.pageTitle')} subtitle={t('quiz.pageSubtitle')}>
      <QuizForm onGenerated={onQuestionsGenerated} />

      {(quiz?.questions ?? questions) && <QuestionList questions={quiz?.questions ?? questions ?? []} />}
    </PageHeader>
  );
}
