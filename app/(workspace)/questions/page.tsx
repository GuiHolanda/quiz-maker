'use client';

import { Suspense } from 'react';
import { QuestionsPageContent } from './components/QuestionsPageContent';
import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { QuizProvider } from '@/features/providers/quiz.provider';

export default function QuestionsPage() {
  return (
    <CertificationsProvider>
      <PublicExamsProvider>
        <QuizProvider>
          <Suspense>
            <QuestionsPageContent />
          </Suspense>
        </QuizProvider>
      </PublicExamsProvider>
    </CertificationsProvider>
  );
}
