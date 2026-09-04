'use client';

import type { BillingInvoice } from '@/shared/types';
import type { StatusTone } from '@/shared/components/ui/tone';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faDownload } from '@fortawesome/free-solid-svg-icons';

import { StatusPill } from '@/shared/components/ui/StatusPill';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { formatMoney, formatShortDate } from '@/app/(workspace)/billing/components/billingFormat';

interface BillingHistoryTableProps {
  readonly invoices: readonly BillingInvoice[];
  readonly isPortalLoading: boolean;
  readonly onViewAll: () => void;
}

const STATUS_TONE: Record<string, StatusTone> = {
  paid: 'ok',
  open: 'busy',
  draft: 'busy',
  void: 'error',
  uncollectible: 'error',
};

const STATUS_KEY: Record<string, string> = {
  paid: 'billing.invoiceStatus.paid',
  open: 'billing.invoiceStatus.open',
  draft: 'billing.invoiceStatus.open',
  void: 'billing.invoiceStatus.void',
  uncollectible: 'billing.invoiceStatus.uncollectible',
};

const GRID = 'grid-cols-[92px_minmax(0,1fr)_96px_104px_72px] sm:grid-cols-[120px_minmax(0,1fr)_120px_130px_96px]';

export function BillingHistoryTable({ invoices, isPortalLoading, onViewAll }: BillingHistoryTableProps) {
  const { t, language } = useTranslation();

  return (
    <section className="overflow-hidden rounded-xl border border-default-200 bg-content1 dark:border-transparent">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-divider px-6 py-5">
        <div>
          <h2 className="text-[17px] font-bold text-foreground">{t('billing.history.title')}</h2>
          <p className="mt-1 text-xs text-default-500">{t('billing.history.subtitle')}</p>
        </div>
        <Button
          className={buttonStyles.secondarySm}
          isLoading={isPortalLoading}
          size="sm"
          variant="bordered"
          onPress={onViewAll}
        >
          <FontAwesomeIcon className="h-3 w-3" icon={faArrowUpRightFromSquare} />
          {t('billing.history.viewAll')}
        </Button>
      </div>

      {invoices.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-default-400">{t('billing.history.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div
              className={`grid ${GRID} gap-4 border-b border-divider px-6 py-3 text-[11px] font-semibold tracking-wide text-default-400`}
            >
              <span>{t('billing.history.colDate')}</span>
              <span>{t('billing.history.colDescription')}</span>
              <span>{t('billing.history.colAmount')}</span>
              <span>{t('billing.history.colStatus')}</span>
              <span className="text-right">{t('billing.history.colReceipt')}</span>
            </div>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`grid ${GRID} items-center gap-4 border-b border-divider/60 px-6 py-4 last:border-b-0`}
              >
                <span className="font-mono text-[13px] text-default-500">
                  {formatShortDate(invoice.date, language)}
                </span>
                <span className="truncate text-[13px] text-foreground">
                  {invoice.description ?? t('billing.history.defaultDescription')}
                </span>
                <span className="font-mono text-[13px] text-foreground">
                  {formatMoney(invoice.amount, invoice.currency, language)}
                </span>
                <span>
                  <StatusPill tone={STATUS_TONE[invoice.status] ?? 'busy'}>
                    {t(STATUS_KEY[invoice.status] ?? 'billing.invoiceStatus.open')}
                  </StatusPill>
                </span>
                <span className="text-right">
                  {invoice.pdfUrl || invoice.hostedUrl ? (
                    <a
                      className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:opacity-80"
                      href={invoice.pdfUrl ?? invoice.hostedUrl ?? '#'}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <FontAwesomeIcon className="h-3 w-3" icon={faDownload} />
                      {t('billing.invoicePdf')}
                    </a>
                  ) : (
                    <span className="text-[13px] text-default-400">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
