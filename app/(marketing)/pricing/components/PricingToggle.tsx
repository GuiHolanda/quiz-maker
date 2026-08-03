'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { usePricingPeriod } from '@/app/(marketing)/pricing/components/PricingPeriodContext';

export function PricingToggle() {
  const { t } = useTranslation();
  const { period, setPeriod } = usePricingPeriod();

  return (
    <div className="inline-flex items-center border border-navy-700 rounded p-1 mt-2">
      <button
        type="button"
        aria-pressed={period === 'monthly'}
        className={`text-sm px-4 py-2 rounded transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'monthly' ? 'bg-navy-800 text-foreground' : 'text-navy-400 hover:text-navy-200'}`}
        onClick={() => setPeriod('monthly')}
      >
        {t('pricing.toggle.monthly')}
      </button>
      <button
        type="button"
        aria-pressed={period === 'yearly'}
        className={`text-sm px-4 py-2 rounded transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${period === 'yearly' ? 'bg-navy-800 text-foreground' : 'text-navy-400 hover:text-navy-200'}`}
        onClick={() => setPeriod('yearly')}
      >
        {t('pricing.toggle.yearly')}
        <span className="text-accent">{t('pricing.toggle.savePercent')}</span>
      </button>
    </div>
  );
}
