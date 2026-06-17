'use client';

import type { UsageStats } from '@/shared/types';

import NextLink from 'next/link';

interface UsageBadgeProps {
  readonly usage: UsageStats;
}

export function UsageBadge({ usage }: UsageBadgeProps) {
  const isUnlimited = usage.questionsLimit === -1;

  if (isUnlimited) return null;

  const pct = Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100));
  const barColor = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-primary';

  return (
    <NextLink className="flex items-center gap-2 group" href="/billing">
      <span className="text-xs text-default-400 whitespace-nowrap">
        {usage.questionsUsed}/{usage.questionsLimit}
      </span>
      <div className="w-16 h-1.5 bg-default-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </NextLink>
  );
}
