'use client';
import { useState } from 'react';
import { title } from '@/components/primitives';
import { AIQuestion } from '@/types';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { QuestionGeneratorForm } from '@/components/quiz/QuestionGeneratorForm';
import { AIQuestionList } from '@/components/quiz/AIQuestionList';
import useQuizContext from '@/features/hooks/useQuizContext.hook';

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
    <>
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Generate your Questions</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create personalized questions for your certifications practice
        </h3>
      </div>

      <QuestionGeneratorForm onGenerated={onQuestionsGenerated} />

      {(state?.aiQuestions.length ?? 0) > 0 && <AIQuestionList questions={state?.aiQuestions ?? []} />}
    </>
  );
}
