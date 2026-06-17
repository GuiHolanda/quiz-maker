'use client';

import { BillingOverview } from '@/app/(workspace)/billing/components/BillingOverview';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export default function BillingPage() {
  return <BillingPageContent />;
}

function BillingPageContent() {
  const { t } = useTranslation();

  return (
    <PageHeader title={t('billing.title')} subtitle={t('billing.subtitle')}>
      <BillingOverview />
    </PageHeader>
  );
}
