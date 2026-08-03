'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';

import { ExamsList } from './components/list/ExamsList';
import { EXAM_CONFIG } from './exam-config';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import type { ExamType } from '@/shared/types';

export default function ExamsPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <ExamsContent />
      </Suspense>
    </ExamsProvider>
  );
}

function ExamsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';
  const config = EXAM_CONFIG[type];

  const addButtonLabel = type === 'certification' ? t('exam.addNewCertification') : t('exam.addNewConcurso');
  const breadcrumbListLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');

  return (
    <PageHeader
      action={
        <Button color="primary" data-testid="add-new-exam-btn" onPress={() => router.push(`/exams/new?type=${type}`)}>
          {addButtonLabel}
        </Button>
      }
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{breadcrumbListLabel}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t(config.pageSubtitle)}
      title={t(config.pageTitle)}
    >
      <section data-testid="configure-list-section">
        <ExamsList type={type} />
      </section>
    </PageHeader>
  );
}
