'use client';

import type { UsageStats } from '@/shared/types';

import NextLink from 'next/link';

interface UsageBadgeProps {
  readonly usage: UsageStats;
}

export function UsageBadge({ usage }: UsageBadgeProps) {
  const pct = Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100));

  if (usage.plan === 'pro') return null;

  return (
    <NextLink className="flex items-center gap-2 group" href="/billing">
      <span className="text-xs text-default-400 whitespace-nowrap">
        {usage.questionsUsed}/{usage.questionsLimit}
      </span>
      <div className="w-16 h-1.5 bg-default-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </NextLink>
  );
}
