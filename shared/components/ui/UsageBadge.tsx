'use client';

import type { UsageStats } from '@/shared/types';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface UsageBadgeProps {
  readonly usage: UsageStats;
}

export function UsageBadge({ usage }: UsageBadgeProps) {
  const { t } = useTranslation();
  const isUnlimited = usage.questionsLimit === -1;

  if (isUnlimited) return null;

  const pct = Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100));
  const barColor = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-primary';

  const resetDate = new Date(usage.periodStartDate);
  resetDate.setDate(resetDate.getDate() + 30);
  const resetLabel = resetDate.toLocaleDateString('pt-BR');

  return (
    <NextLink className="flex flex-col gap-1 group" href="/billing">
      <div className="flex items-center gap-2">
        <span className="text-xs text-default-400 whitespace-nowrap">
          {usage.questionsUsed}/{usage.questionsLimit}
        </span>
        <div className="w-16 h-1.5 bg-default-200 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-[10px] text-default-400 whitespace-nowrap">
        {t('billing.questionsRenewNote', { date: resetLabel })}
      </span>
    </NextLink>
  );
}
