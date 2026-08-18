'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { useState } from 'react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getCheckoutUrl } from '@/features/connectors';

interface UpgradeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly product?: 'pro' | 'pro_ai';
}

export function UpgradeModal({ isOpen, onClose, product = 'pro' }: UpgradeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);
  const isProAi = product === 'pro_ai';

  const planNameKey = isProAi ? 'pricing.plan.proAi' : 'pricing.plan.pro';
  const monthlyPriceKey = isProAi ? 'pricing.plan.proAi.monthly' : 'pricing.plan.pro.monthly';
  const yearlyPriceKey = isProAi ? 'pricing.plan.proAi.yearly' : 'pricing.plan.pro.yearly';

  async function handleUpgrade(period: 'monthly' | 'yearly') {
    setLoading(period);
    try {
      const url = await getCheckoutUrl(period, product);

      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">
            {t('billing.upgradeModal.title', { plan: t(planNameKey) })}
          </h2>
          <p className="text-sm text-default-500 font-normal">
            {t(isProAi ? 'billing.upgradeModal.subtitleProAi' : 'billing.upgradeModal.subtitle')}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-2 mb-2">
            <p className="text-xs font-semibold text-primary">{t(planNameKey)}</p>
            <ul className="flex flex-col gap-1">
              <li className="text-sm text-default-500">
                ✓ {t(isProAi ? 'billing.upgradeModal.benefit1ProAi' : 'billing.upgradeModal.benefit1')}
              </li>
              <li className="text-sm text-default-500">
                ✓ {t(isProAi ? 'billing.upgradeModal.benefit2ProAi' : 'billing.upgradeModal.benefit2')}
              </li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 bg-content1 border border-default-200 rounded-xl p-4 text-left hover:bg-default-100 transition-colors duration-200 cursor-pointer"
              disabled={loading !== null}
              onClick={() => handleUpgrade('monthly')}
            >
              <p className="text-sm font-bold text-foreground">
                {t(monthlyPriceKey)}
                <span className="font-normal text-default-500">{t('pricing.plan.perMonth')}</span>
              </p>
            </button>
            <button
              className="flex-1 bg-primary/5 border border-primary/20 rounded-xl p-4 text-left hover:bg-primary/10 transition-colors duration-200 cursor-pointer"
              disabled={loading !== null}
              onClick={() => handleUpgrade('yearly')}
            >
              <p className="text-sm font-bold text-foreground">
                {t(yearlyPriceKey)}
                <span className="font-normal text-default-500">{t('pricing.plan.perMonth')}</span>
              </p>
              <p className="text-xs text-default-500">{t('pricing.plan.billedAnnually')}</p>
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200"
            variant="bordered"
            onPress={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            isLoading={loading !== null}
            onPress={() => handleUpgrade('monthly')}
          >
            {t('billing.upgradeModal.cta')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
