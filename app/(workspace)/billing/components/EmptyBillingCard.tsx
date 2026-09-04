'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowUp, faCreditCard } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface EmptyBillingCardProps {
  readonly showUpgrade: boolean;
  readonly onUpgrade: () => void;
}

export function EmptyBillingCard({ showUpgrade, onUpgrade }: EmptyBillingCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
      <span className="text-xs font-semibold text-primary">{t('billing.paymentMethodLabel')}</span>
      <div className="mt-4 flex items-center gap-3.5">
        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-background text-default-400">
          <FontAwesomeIcon className="h-4 w-4" icon={faCreditCard} />
        </div>
        <p className="text-sm text-default-400">{t('billing.noPaymentMethod')}</p>
      </div>
      <p className="mt-4 border-t border-divider pt-4 text-xs leading-relaxed text-default-500 text-pretty">
        {t('billing.noBillingExplainer')}
      </p>
      {showUpgrade && (
        <Button className={`${buttonStyles.primary} mt-4 w-full`} onPress={onUpgrade}>
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCircleArrowUp} />
          {t('billing.upgradeCta')}
        </Button>
      )}
    </div>
  );
}
