'use client';

import type { BillingProfile, PaymentMethodInfo } from '@/shared/types';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { KeyValueList } from '@/shared/components/ui/KeyValueList';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface PaymentMethodCardProps {
  readonly paymentMethod: PaymentMethodInfo | null;
  readonly profile: BillingProfile;
  readonly isPortalLoading: boolean;
  readonly onManage: () => void;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PaymentMethodCard({ paymentMethod, profile, isPortalLoading, onManage }: PaymentMethodCardProps) {
  const { t } = useTranslation();

  const rows = [
    { label: t('billing.profile.email'), value: profile.email ?? t('billing.profile.notProvided') },
    { label: t('billing.profile.taxId'), value: profile.taxId ?? t('billing.profile.notProvided') },
    { label: t('billing.profile.address'), value: profile.address ?? t('billing.profile.notProvided') },
    { label: t('billing.profile.customerId'), value: profile.customerId },
  ];

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-primary">{t('billing.paymentMethodLabel')}</span>
        <Button
          className={buttonStyles.secondarySm}
          isLoading={isPortalLoading}
          size="sm"
          variant="bordered"
          onPress={onManage}
        >
          {t('billing.paymentUpdate')}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3.5">
        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-background text-default-400">
          <FontAwesomeIcon className="h-4 w-4" icon={faCreditCard} />
        </div>
        {paymentMethod ? (
          <div className="min-w-0">
            <p className="font-mono text-sm text-foreground">
              {t('billing.cardLine', { brand: titleCase(paymentMethod.brand), last4: paymentMethod.last4 })}
            </p>
            <p className="mt-0.5 text-xs text-default-400">
              {t('billing.cardExpires', {
                month: String(paymentMethod.expMonth).padStart(2, '0'),
                year: paymentMethod.expYear,
              })}
              {paymentMethod.holder && ` · ${t('billing.cardHolder', { name: paymentMethod.holder })}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-default-400">{t('billing.noPaymentMethod')}</p>
        )}
      </div>

      <div className="mt-4 border-t border-divider pt-1">
        <KeyValueList rows={rows} />
      </div>

      <Button className={`${buttonStyles.flat} mt-4 w-full`} isLoading={isPortalLoading} onPress={onManage}>
        <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPenToSquare} />
        {t('billing.manageBillingData')}
      </Button>
    </div>
  );
}
