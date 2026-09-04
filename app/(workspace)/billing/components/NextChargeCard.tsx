'use client';

import type { PaymentMethodInfo, UpcomingInvoiceInfo } from '@/shared/types';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { formatDate, formatMoney } from '@/app/(workspace)/billing/components/billingFormat';

interface NextChargeCardProps {
  readonly upcoming: UpcomingInvoiceInfo;
  readonly paymentMethod: PaymentMethodInfo | null;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function NextChargeCard({ upcoming, paymentMethod }: NextChargeCardProps) {
  const { t, language } = useTranslation();

  const cardLabel = paymentMethod
    ? t('billing.cardLine', { brand: titleCase(paymentMethod.brand), last4: paymentMethod.last4 })
    : null;

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
      <span className="text-xs font-semibold text-primary">{t('billing.nextChargeLabel')}</span>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-mono text-2xl tracking-tight text-foreground">
          {formatMoney(upcoming.amount, upcoming.currency, language)}
        </span>
        {upcoming.date && (
          <span className="text-sm text-default-500">
            {t('billing.nextChargeOn', { date: formatDate(upcoming.date, language) })}
          </span>
        )}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-default-500 text-pretty">
        {cardLabel ? t('billing.nextChargeNote', { card: cardLabel }) : t('billing.nextChargeNoteNoCard')}
      </p>
    </div>
  );
}
