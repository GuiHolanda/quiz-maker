'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { usePricingPeriod } from '@/app/(marketing)/pricing/components/PricingPeriodContext';

export function PricingToggle() {
  const { t } = useTranslation();
  const { period, setPeriod } = usePricingPeriod();

  return (
    <div className="inline-flex items-center border border-white/[0.12] rounded p-1 mt-2">
      <button
        type="button"
        aria-pressed={period === 'monthly'}
        className={`text-sm px-4 py-2 rounded transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          period === 'monthly' ? 'bg-white/10 text-foreground' : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => setPeriod('monthly')}
      >
        {t('pricing.toggle.monthly')}
      </button>
      <button
        type="button"
        aria-pressed={period === 'yearly'}
        className={`text-sm px-4 py-2 rounded transition-all flex items-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          period === 'yearly' ? 'bg-white/10 text-foreground' : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => setPeriod('yearly')}
      >
        {t('pricing.toggle.yearly')}
        <span className="text-primary">{t('pricing.toggle.savePercent')}</span>
      </button>
    </div>
  );
}
