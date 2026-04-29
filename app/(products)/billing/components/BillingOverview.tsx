'use client';

import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UsageCard } from '@/app/(products)/billing/components/UsageCard';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { getBillingUsage, getPortalUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { UsageStats } from '@/shared/types';

export function BillingOverview() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    getBillingUsage().then(setUsage);
  }, []);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      addToast({ title: t('billing.toast.upgraded'), color: 'success' });
    }
  }, [searchParams, t]);

  if (!usage) return null;

  const resetDate = new Date(usage.periodStartDate);
  resetDate.setDate(resetDate.getDate() + 30);
  const resetLabel = resetDate.toLocaleDateString();

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const url = await getPortalUrl();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  }

  const certLimitLabel =
    usage.certificationsLimit === -1 ? t('billing.unlimited') : String(usage.certificationsLimit);
  const qLimitLabel =
    usage.questionsLimit === -1 ? t('billing.unlimited') : String(usage.questionsLimit);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">
            {t('billing.currentPlan')}
          </p>
          <p className="text-xl font-bold text-foreground">
            {usage.plan === 'pro' ? t('billing.planPro') : t('billing.planFree')}
          </p>
          <p className="text-xs text-default-400 mt-1">
            {t('billing.periodResetsOn', { date: resetLabel })}
          </p>
        </div>
        {usage.plan === 'free' ? (
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            onPress={() => setIsUpgradeOpen(true)}
          >
            {t('billing.upgradeButton')}
          </Button>
        ) : (
          <Button
            variant="bordered"
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200"
            isLoading={portalLoading}
            onPress={handlePortal}
          >
            {t('billing.manageButton')}
          </Button>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
          {t('billing.usageTitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageCard
            label={t('billing.questions')}
            used={usage.questionsUsed}
            limit={usage.questionsLimit}
            limitLabel={qLimitLabel}
          />
          <UsageCard
            label={t('billing.certifications')}
            used={usage.certificationsUsed}
            limit={usage.certificationsLimit}
            limitLabel={certLimitLabel}
          />
        </div>
      </div>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}
