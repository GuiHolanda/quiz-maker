'use client';
import { useState } from 'react';
import { AIQuestion } from '@/shared/types';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { GeneratedQuestionsList } from '@/app/(workspace)/certifications/generate/components/GeneratedQuestionsList';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { QuestionGeneratorForm } from './components/QuestionGeneratorForm';

export default function QuizPage() {

  return (
    <CertificationsProvider>
      <QuizProvider>
        <AIQuestionPageContent  />
      </QuizProvider>
    </CertificationsProvider>
  );
}

function AIQuestionPageContent() {
  const { state, replaceQuiz, setAIquestions } = useQuizContext();
  const { t } = useTranslation();

  const onQuestionsGenerated = (generatedQuestions: AIQuestion[] | undefined) => {
    if (!generatedQuestions) return;
    replaceQuiz({
      meta: {
        topic: generatedQuestions[0]?.topic ?? '',
        num_questions: generatedQuestions.length,
      },
      questions: [],
      answers: {},
      isFinished: false,
      aiQuestions: generatedQuestions,
      selectedAIQuestions: [],
    });
    setAIquestions(generatedQuestions, null);
  };

  return (
    <PageHeader title={t('generate.pageTitle')} subtitle={t('generate.pageSubtitle')}>
      <QuestionGeneratorForm onGenerated={onQuestionsGenerated} />

      {(state?.aiQuestions?.length ?? 0) > 0 && <GeneratedQuestionsList questions={state?.aiQuestions ?? []} />}
    </PageHeader>
  );
}
