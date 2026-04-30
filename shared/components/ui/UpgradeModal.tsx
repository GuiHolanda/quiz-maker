'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getCheckoutUrl } from '@/features/connectors';
import { useState } from 'react';

interface UpgradeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  async function handleUpgrade(period: 'monthly' | 'yearly') {
    setLoading(period);
    try {
      const url = await getCheckoutUrl(period);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">{t('billing.upgradeModal.title')}</h2>
          <p className="text-sm text-default-500 font-normal">{t('billing.upgradeModal.subtitle')}</p>
        </ModalHeader>
        <ModalBody>
          <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-2 mb-2">
            <p className="text-xs font-semibold text-primary">{t('billing.planPro')}</p>
            <ul className="flex flex-col gap-1">
              <li className="text-sm text-default-500">✓ {t('billing.upgradeModal.benefit1')}</li>
              <li className="text-sm text-default-500">✓ {t('billing.upgradeModal.benefit2')}</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleUpgrade('monthly')}
              disabled={loading !== null}
              className="flex-1 bg-content1 border border-default-200 rounded-xl p-4 text-left hover:bg-default-100 transition-colors duration-200 cursor-pointer"
            >
              <p className="text-sm font-bold text-foreground">{t('billing.upgradeModal.monthly')}</p>
            </button>
            <button
              onClick={() => handleUpgrade('yearly')}
              disabled={loading !== null}
              className="flex-1 bg-primary/5 border border-primary/20 rounded-xl p-4 text-left hover:bg-primary/10 transition-colors duration-200 cursor-pointer"
            >
              <p className="text-sm font-bold text-foreground">{t('billing.upgradeModal.yearly')}</p>
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="bordered"
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200"
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
