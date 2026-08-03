'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const STATS = [
  { value: '1.2M+', label: 'homepage.stats.questionsGenerated' },
  { value: '32', label: 'homepage.stats.certificationTracks' },
  { value: '94.7%', label: 'homepage.stats.passRate' },
  { value: '<200ms', label: 'homepage.stats.generateTime' },
] as const;

export function StatsStrip() {
  const { t } = useTranslation();

  return (
    <div className="bg-navy-950 border-y border-navy-800/40 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-navy-800">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:px-6">
              <p className="font-mono text-xl sm:text-2xl font-medium text-white">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-0.5">{t(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
