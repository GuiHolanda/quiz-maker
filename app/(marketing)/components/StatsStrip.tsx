'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const STATS = [
  { value: '1.2M+', label: 'homepage.stats.questionsGenerated' },
  { value: '32', label: 'homepage.stats.certificationTracks' },
  { value: '12.400', label: 'homepage.stats.professionals' },
  { value: '<200ms', label: 'homepage.stats.generateTime' },
] as const;

export function StatsStrip() {
  const { t } = useTranslation();

  return (
    <div className="bg-mkt-divider">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-mkt-bg py-6 px-6 text-center">
            <p className="mono text-2xl font-medium text-mkt-text">{stat.value}</p>
            <p className="kick mt-1">{t(stat.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
