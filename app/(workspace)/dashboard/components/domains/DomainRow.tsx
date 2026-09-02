'use client';

import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardDomainStat } from '@/shared/types';

interface DomainRowProps {
  readonly domain: DashboardDomainStat;
}

export function DomainRow({ domain }: DomainRowProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-44 shrink-0">
        <p className="font-semibold text-foreground text-xs truncate">{domain.sectionName}</p>
        <p className="font-mono text-[9px] text-default-400">
          {domain.totalAttempts} {domain.totalAttempts === 1 ? 'attempt' : 'attempts'}
        </p>
      </div>
      <div className="flex-1 relative">
        <div className="h-2 bg-default-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${domain.avgScore}%` }} />
        </div>
      </div>
      <div className="w-10 text-right shrink-0">
        <span className={`font-mono font-semibold text-xs ${scoreToneText(domain.avgScore)}`}>{domain.avgScore}%</span>
      </div>
    </div>
  );
}
