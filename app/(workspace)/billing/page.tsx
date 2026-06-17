'use client';

import { Suspense } from 'react';

import { BillingOverview } from '@/app/(workspace)/billing/components/BillingOverview';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export default function BillingPage() {
  return <BillingPageContent />;
}

function BillingPageContent() {
  const { t } = useTranslation();

  return (
    <PageHeader subtitle={t('billing.subtitle')} title={t('billing.title')}>
      <Suspense>
        <BillingOverview />
      </Suspense>
    </PageHeader>
  );
}
