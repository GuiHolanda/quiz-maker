'use client';

import { Suspense } from 'react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import { BillingOverview } from '@/app/(workspace)/billing/components/BillingOverview';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export default function BillingPage() {
  return <BillingPageContent />;
}

function BillingPageContent() {
  const { t } = useTranslation();

  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.billing')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('billing.subtitle')}
      title={t('billing.title')}
    >
      <Suspense>
        <BillingOverview />
      </Suspense>
    </PageHeader>
  );
}
