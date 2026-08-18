'use client';

import { createContext, useContext, useMemo, useState } from 'react';

import type { ExamLandingConfig, ExamLandingSampleQuestion } from '@/shared/types';

interface ExamPracticeContextValue {
  readonly question: ExamLandingSampleQuestion;
  readonly selectedTopic: string;
  readonly pickedIndex: number | null;
  readonly selectTopic: (name: string) => void;
  readonly pickOption: (index: number) => void;
  readonly nextQuestion: () => void;
}

const ExamPracticeContext = createContext<ExamPracticeContextValue | null>(null);

interface ExamPracticeProviderProps {
  readonly config: ExamLandingConfig;
  readonly children: React.ReactNode;
}

// The hero question panel and the syllabus grid sit in different sections but
// share one selection: picking a subject below re-aims the sample question above.
export function ExamPracticeProvider({ config, children }: ExamPracticeProviderProps) {
  // Starts on the subject of the question already on screen, so the hero panel
  // and the syllabus agree before the visitor touches anything.
  const [selectedTopic, setSelectedTopic] = useState(config.sampleQuestions[0]?.topic ?? config.topics[0]?.name ?? '');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const value = useMemo<ExamPracticeContextValue>(() => {
    const question = config.sampleQuestions[questionIndex % config.sampleQuestions.length];

    return {
      question,
      selectedTopic,
      pickedIndex,
      // Only some subjects have an authored sample; the others just move the
      // selection, leaving the question that is already on screen.
      selectTopic: (name: string) => {
        const match = config.sampleQuestions.findIndex((sample) => sample.topic === name);
        setSelectedTopic(name);
        setPickedIndex(null);
        if (match > -1) setQuestionIndex(match);
      },
      pickOption: (index: number) => setPickedIndex((current) => current ?? index),
      nextQuestion: () => {
        setQuestionIndex((current) => current + 1);
        setPickedIndex(null);
      },
    };
  }, [config, questionIndex, pickedIndex, selectedTopic]);

  return <ExamPracticeContext.Provider value={value}>{children}</ExamPracticeContext.Provider>;
}

export function useExamPractice(): ExamPracticeContextValue {
  const context = useContext(ExamPracticeContext);
  if (!context) throw new Error('useExamPractice must be used inside ExamPracticeProvider');
  return context;
}
