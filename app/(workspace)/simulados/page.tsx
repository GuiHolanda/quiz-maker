'use client';

import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import { CreateSimuladoSection } from './components/CreateSimuladoSection';
import { SimuladosCreatedSection } from './components/list/SimuladosCreatedSection';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { MockExamsProvider } from '@/features/providers/mockExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';

function SimuladosPageContent() {
  const { t } = useTranslation();

  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem>{t('nav.simulados')}</BreadcrumbItem>
          <BreadcrumbItem>{t('simulado.create.breadcrumbNew')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('simulado.create.subtitle')}
      title={t('simulado.create.title')}
    >
      <div className="flex flex-col gap-12">
        <CreateSimuladoSection />
        <SimuladosCreatedSection />
      </div>
    </PageHeader>
  );
}

export default function SimuladosPage() {
  return (
    <ExamsProvider>
      <MockExamsProvider>
        <SimuladosPageContent />
      </MockExamsProvider>
    </ExamsProvider>
  );
}
