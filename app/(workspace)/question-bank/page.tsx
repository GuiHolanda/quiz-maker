'use client';

import { Suspense } from 'react';

import { QuestionBankContent } from './components/QuestionBankContent';

export default function QuestionBankPage() {
  return (
    <Suspense>
      <QuestionBankContent />
    </Suspense>
  );
}
