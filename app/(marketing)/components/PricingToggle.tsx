'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { usePricingPeriod } from '@/app/(marketing)/components/PricingPeriodContext';

export function PricingToggle() {
  const { t } = useTranslation();
  const { period, setPeriod } = usePricingPeriod();

  return (
    <div className="inline-flex items-center border border-mkt-divider p-1 mt-2">
      <button
        type="button"
        aria-pressed={period === 'monthly'}
        className={`text-sm px-4 py-2 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent ${
          period === 'monthly' ? 'bg-mkt-accent text-white' : 'text-mkt-text opacity-60 hover:opacity-100'
        }`}
        onClick={() => setPeriod('monthly')}
      >
        {t('pricing.toggle.monthly')}
      </button>
      <button
        type="button"
        aria-pressed={period === 'yearly'}
        className={`text-sm px-4 py-2 transition-colors flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent ${
          period === 'yearly' ? 'bg-mkt-accent text-white' : 'text-mkt-text opacity-60 hover:opacity-100'
        }`}
        onClick={() => setPeriod('yearly')}
      >
        {t('pricing.toggle.yearly')}
        <span className="opacity-90">{t('pricing.toggle.savePercent')}</span>
      </button>
    </div>
  );
}
