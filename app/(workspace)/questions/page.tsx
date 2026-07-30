'use client';

import { Suspense } from 'react';
import { QuestionsPageContent } from './components/QuestionsPageContent';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { GenerationJobsProvider } from '@/features/providers/generationJobs.provider';

export default function QuestionsPage() {
  return (
    <ExamsProvider>
      <QuizProvider>
        <GenerationJobsProvider>
          <Suspense>
            <QuestionsPageContent />
          </Suspense>
        </GenerationJobsProvider>
      </QuizProvider>
    </ExamsProvider>
  );
}
