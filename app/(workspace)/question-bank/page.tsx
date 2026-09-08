'use client';

import { Suspense } from 'react';

import { QuestionBankContent } from './components/QuestionBankContent';

import { ExamsProvider } from '@/features/providers/exams.provider';

export default function QuestionBankPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <QuestionBankContent />
      </Suspense>
    </ExamsProvider>
  );
}
