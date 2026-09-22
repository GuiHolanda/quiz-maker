'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneBg, scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardWeakDomain } from '@/shared/types';

interface WeakDomainRowProps {
  readonly domain: DashboardWeakDomain;
}

export function WeakDomainRow({ domain }: WeakDomainRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-sm text-default-600">{domain.sectionName}</span>
      <div className="h-1.5 flex-1 min-w-[60px] rounded-full bg-background overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreToneBg(domain.accuracy)}`}
          style={{ width: `${domain.accuracy}%` }}
        />
      </div>
      <span className={`w-10 shrink-0 text-right font-mono text-sm ${scoreToneText(domain.accuracy)}`}>
        {domain.accuracy}%
      </span>
      <span className="w-24 shrink-0 text-right text-xs text-default-400">
        {t('dashboard.home.weakVolume', { count: domain.questionVolume })}
      </span>
    </div>
  );
}
