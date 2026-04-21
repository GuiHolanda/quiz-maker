'use client';
import { useState } from 'react';
import { AIQuestion } from '@/types';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { GeneratedQuestionsList } from '@/app/generate-questions/components/GeneratedQuestionsList';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
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
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <div className="flex flex-col mb-8 gap-1.5">
          <h1 className="page-header-title">Generate questions</h1>
          <p className="page-header-subtitle">
            Pick a certification and topic, choose how many questions you want, and let the AI build a fresh question set. Review, select, and save the ones you want to keep.
          </p>
        </div>

        <QuestionGeneratorForm onGenerated={onQuestionsGenerated} />

        {(state?.aiQuestions?.length ?? 0) > 0 && <GeneratedQuestionsList questions={state?.aiQuestions ?? []} />}
      </div>
    </div>
  );
}
