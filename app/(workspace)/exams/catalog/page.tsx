'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import { CatalogSection } from '../components/catalog/CatalogSection';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import type { ExamType } from '@/shared/types';

export default function ExamCatalogPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <ExamCatalogContent />
      </Suspense>
    </ExamsProvider>
  );
}

function ExamCatalogContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';

  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const titleKey = type === 'certification' ? 'catalog.sectionTitleCert' : 'catalog.sectionTitleConcurso';
  const subtitleKey = type === 'certification' ? 'catalog.sectionSubtitleCert' : 'catalog.sectionSubtitleConcurso';

  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem href={`/exams?type=${type}`}>{listLabel}</BreadcrumbItem>
          <BreadcrumbItem>{t('catalog.breadcrumb')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      title={t(titleKey)}
      subtitle={t(subtitleKey)}
    >
      <CatalogSection type={type} />
    </PageHeader>
  );
}
