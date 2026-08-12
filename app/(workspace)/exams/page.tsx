'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { ExamsList } from './components/list/ExamsList';
import { CatalogDiscoveryCard } from './components/catalog/CatalogDiscoveryCard';
import { EXAM_CONFIG } from './exam-config';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { buttonStyles } from '@/config/constants/buttonStyles';
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
  const { certifications, publicExams, isLoading } = useExamsContext();

  const exams = type === 'certification' ? certifications : publicExams;
  const hasExams = !isLoading && exams.length > 0;

  const addButtonLabel = type === 'certification' ? t('exam.addNewCertification') : t('exam.addNewConcurso');
  const breadcrumbListLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');

  return (
    <PageHeader
      action={
        hasExams ? (
          <Button
            className={buttonStyles.primary}
            data-testid="add-new-exam-btn"
            onPress={() => router.push(`/exams/new?type=${type}`)}
            radius="sm"
            startContent={<FontAwesomeIcon icon={faPlusSquare} />}
          >
            {addButtonLabel}
          </Button>
        ) : undefined
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
      <CatalogDiscoveryCard type={type} />
    </PageHeader>
  );
}
