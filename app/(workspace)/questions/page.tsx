'use client';

import { Suspense } from 'react';
import { QuestionsPageContent } from './components/QuestionsPageContent';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { QuizProvider } from '@/features/providers/quiz.provider';
import { GenerationJobsProvider } from '@/features/providers/generationJobs.provider';

export default function QuestionsPage() {
  return (
    <CertificationsProvider>
      <PublicExamsProvider>
        <QuizProvider>
          <GenerationJobsProvider>
            <Suspense>
              <QuestionsPageContent />
            </Suspense>
          </GenerationJobsProvider>
        </QuizProvider>
      </PublicExamsProvider>
    </CertificationsProvider>
  );
}
