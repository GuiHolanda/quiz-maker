'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PLAN_LIMITS } from '@/config/constants';

// These used to be invented traction numbers (questions generated, people
// studying, latency). Nothing backed them, and PRODUCT.md records that there is
// no proof on hand yet. They now state capability, which is verifiable and which
// the rest of the page demonstrates.
const STATS = [
  { key: 'free', value: String(PLAN_LIMITS.free.questionsPerPeriod) },
  { key: 'fresh' },
  { key: 'perOption' },
  { key: 'byEdital' },
] as const;

export function StatsStrip() {
  const { t } = useTranslation();

  return (
    <div className="bg-mkt-surface border-t border-mkt-divider">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
        {STATS.map((stat) => (
          <div key={stat.key} className="bg-mkt-surface border-e border-mkt-divider py-6 px-6 text-center">
            <p className="mono text-xl sm:text-2xl font-medium text-mkt-text leading-tight">
              {'value' in stat ? stat.value : t(`homepage.stats.${stat.key}.value`)}
            </p>
            <p className="kick mt-1">{t(`homepage.stats.${stat.key}.label`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
