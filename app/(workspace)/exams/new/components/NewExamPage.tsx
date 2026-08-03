'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ExamType } from '@/shared/types';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { ExamWizard } from '@/app/(workspace)/exams/components/wizard/ExamWizard';
import { EntryScreen } from './EntryScreen';

interface NewExamPageProps {
  readonly type: ExamType;
}

export function NewExamPage({ type }: NewExamPageProps) {
  const router = useRouter();
  const [view, setView] = useState<'entry' | 'wizard'>('entry');

  if (view === 'wizard') {
    return (
      <ExamsProvider>
        <ExamWizard
          type={type}
          onBack={() => setView('entry')}
          onSaved={() => router.push(`/exams?type=${type}`)}
        />
      </ExamsProvider>
    );
  }

  return <EntryScreen type={type} onStartManual={() => setView('wizard')} />;
}
