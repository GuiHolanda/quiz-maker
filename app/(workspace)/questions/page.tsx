'use client';

import { Suspense } from 'react';
import { QuestionsPageContent } from './components/QuestionsPageContent';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { GenerationJobsProvider } from '@/features/providers/generationJobs.provider';

export default function QuestionsPage() {
  return (
    <ExamsProvider>
      <GenerationJobsProvider>
        <Suspense>
          <QuestionsPageContent />
        </Suspense>
      </GenerationJobsProvider>
    </ExamsProvider>
  );
}
