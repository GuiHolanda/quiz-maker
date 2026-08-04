'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import type { ExamType } from '@/shared/types';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { ExamWizard } from '@/app/(workspace)/exams/components/wizard/ExamWizard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EntryScreen } from './EntryScreen';

interface NewExamPageProps {
  readonly type: ExamType;
}

export function NewExamPage({ type }: NewExamPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [view, setView] = useState<'entry' | 'wizard'>('entry');

  const listHref = type === 'certification' ? '/exams?type=certification' : '/exams?type=public_exam';
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const newLabel = type === 'certification' ? t('nav.newCertification') : t('nav.newConcurso');

  if (view === 'wizard') {
    return (
      <ExamsProvider>
        <PageHeader
          breadcrumbs={
            <Breadcrumbs>
              <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
              <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
              <BreadcrumbItem>{newLabel}</BreadcrumbItem>
            </Breadcrumbs>
          }
        >
          <ExamWizard
            type={type}
            onBack={() => setView('entry')}
            onSaved={() => router.push(`/exams?type=${type}`)}
          />
        </PageHeader>
      </ExamsProvider>
    );
  }

  return <EntryScreen type={type} onStartManual={() => setView('wizard')} />;
}
