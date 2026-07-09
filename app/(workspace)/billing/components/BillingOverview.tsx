'use client';

import type { UsageStats } from '@/shared/types';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faFileContract,
  faReceipt,
  faRobot,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { UsageCard } from '@/app/(workspace)/billing/components/UsageCard';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { getBillingUsage, getPortalUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

export function BillingOverview() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const toastFiredRef = useRef(false);
  const isUpgradeFlow = searchParams.get('upgraded') === 'true';

  useEffect(() => {
    if (!isUpgradeFlow) {
      getBillingUsage().then(setUsage);
      return;
    }

    let attempts = 0;
    let cancelled = false;

    async function pollUntilUpgraded() {
      while (attempts < 8 && !cancelled) {
        const data = await getBillingUsage();

        if (cancelled) return;

        if (data.plan !== 'free' || attempts === 7) {
          setUsage(data);
          return;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    pollUntilUpgraded();

    return () => {
      cancelled = true;
    };
  }, [isUpgradeFlow]);

  useEffect(() => {
    if (!isUpgradeFlow || !usage || toastFiredRef.current) return;
    toastFiredRef.current = true;
    notify.success(t('billing.toast.upgraded'), t('billing.toast.upgradedDescription'));
  }, [isUpgradeFlow, usage, t]);

  if (!usage) return null;

  const resetDate = new Date(usage.periodStartDate);

  resetDate.setDate(resetDate.getDate() + 30);
  const resetLabel = resetDate.toLocaleDateString();

  const isPaid = usage.plan !== 'free';

  const certLimitLabel = usage.certificationsLimit === -1 ? t('billing.unlimited') : String(usage.certificationsLimit);
  const qLimitLabel = usage.questionsLimit === -1 ? t('billing.unlimited') : String(usage.questionsLimit);

  const planLabel =
    usage.plan === 'pro_ai'
      ? t('billing.planProAi')
      : usage.plan === 'pro'
        ? t('billing.planPro')
        : t('billing.planFree');

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const url = await getPortalUrl();

      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {renderPlanBanner()}
      {renderUsageSection()}
      {isPaid && renderPaymentSection()}
      {isPaid && renderBillingHistorySection()}
      {isPaid && renderCancelSection()}
      {renderCancelModal()}
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );

  function renderPlanBanner() {
    return (
      <section className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold text-foreground">{planLabel}</h2>
            {isPaid && (
              <Chip color="success" size="sm" variant="flat">
                {t('billing.planActive')}
              </Chip>
            )}
          </div>
          <p className="text-sm text-default-500">
            {isPaid
              ? t('billing.nextBilling', { date: resetLabel })
              : t('billing.periodResetsOn', { date: resetLabel })}
          </p>
        </div>
        {isPaid ? (
          <Button
            className={buttonStyles.secondary}
            isLoading={portalLoading}
            variant="bordered"
            onPress={handlePortal}
          >
            {t('billing.changePlan')}
          </Button>
        ) : (
          <Button className={buttonStyles.primary} onPress={() => setIsUpgradeOpen(true)}>
            {t('billing.upgradeButton')}
          </Button>
        )}
      </section>
    );
  }

  function renderUsageSection() {
    return (
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('billing.usageSectionTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UsageCard
            icon={faRobot}
            label={t('billing.questionsCard')}
            limit={usage!.questionsLimit}
            limitLabel={qLimitLabel}
            renewNote={t('billing.questionsRenewNote', { date: resetLabel })}
            used={usage!.questionsUsed}
          />
          <UsageCard
            icon={faFileContract}
            label={t('billing.certificationsCard')}
            limit={usage!.certificationsLimit}
            limitLabel={certLimitLabel}
            renewNote={
              usage!.certificationsLimit === -1
                ? t('billing.certificationsNote')
                : t('billing.questionsRenewNote', { date: resetLabel })
            }
            used={usage!.certificationsUsed}
          />
        </div>
      </section>
    );
  }

  function renderPaymentSection() {
    return (
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('billing.paymentSectionTitle')}</h3>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-default-100 border border-default-200 rounded-lg flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <p className="text-sm text-default-500">{t('billing.paymentManagedNote')}</p>
          </div>
          <Button className={buttonStyles.secondary} isLoading={portalLoading} variant="bordered" onPress={handlePortal}>
            {t('billing.updatePayment')}
          </Button>
        </div>
      </section>
    );
  }

  function renderBillingHistorySection() {
    return (
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('billing.billingSectionTitle')}</h3>
        <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-default-100 border border-default-200 rounded-lg flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faReceipt} />
            </div>
            <p className="text-sm text-default-500">{t('billing.billingSectionTitle')}</p>
          </div>
          <Button className={buttonStyles.secondary} isLoading={portalLoading} variant="bordered" onPress={handlePortal}>
            {t('billing.viewInvoices')}
          </Button>
        </div>
      </section>
    );
  }

  function renderCancelSection() {
    return (
      <section className="pt-6 border-t border-default-200">
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-6">
          <h3 className="text-base font-semibold text-danger mb-2">{t('billing.cancelButton')}</h3>
          <p className="text-sm text-default-500 mb-4 max-w-2xl">{t('billing.cancelDescription')}</p>
          <Button className={buttonStyles.dangerFlat} onPress={() => setIsCancelOpen(true)}>
            {t('billing.cancelButton')}
          </Button>
        </div>
      </section>
    );
  }

  function renderCancelModal() {
    return (
      <Modal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col items-center gap-0 pt-6">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-3">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <span className="text-base font-bold text-foreground">{t('billing.cancelModalTitle')}</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-center text-default-500">{t('billing.cancelConfirm')}</p>
          </ModalBody>
          <ModalFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              className={`flex-1 ${buttonStyles.secondary}`}
              variant="bordered"
              onPress={() => setIsCancelOpen(false)}
            >
              {t('billing.cancelKeep')}
            </Button>
            <Button className={`flex-1 ${buttonStyles.danger}`} isLoading={portalLoading} onPress={handlePortal}>
              {t('billing.cancelConfirmCta')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
}
