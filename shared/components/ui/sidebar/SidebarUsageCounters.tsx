'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowUp } from '@fortawesome/free-solid-svg-icons';
import NextLink from 'next/link';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

interface SidebarUsageCountersProps {
  readonly isCollapsed?: boolean;
}

interface UsageMetric {
  readonly labelKey: string;
  readonly used: number;
  readonly limit: number;
}

export function SidebarUsageCounters({ isCollapsed }: SidebarUsageCountersProps) {
  const { t } = useTranslation();
  const { usage } = useUsageContext();

  if (!usage) return null;

  const metrics: readonly UsageMetric[] = [
    { labelKey: 'sidebar.questionsUsed', used: usage.questionsUsed, limit: usage.questionsLimit },
    { labelKey: 'sidebar.examsUsed', used: usage.examsUsed, limit: usage.examsLimit },
    { labelKey: 'sidebar.autoConfigsUsed', used: usage.autoConfigUsed, limit: usage.autoConfigLimit },
  ];
  const showUpgradeCta = usage.questionsLimit !== -1;

  return (
    <div className={`p-3 border-t border-content2 shrink-0 ${isCollapsed ? 'hidden' : ''}`}>
      <div className="rounded-xl border border-default-200 dark:border-transparent bg-content1 p-3">
        <p className="font-mono text-xs text-navy-500 uppercase tracking-widest">{t('sidebar.planUsage')}</p>
        <div className="mt-2.5 flex flex-col gap-2.5">{metrics.map((metric) => renderMetricRow(metric))}</div>
        {showUpgradeCta && (
          <NextLink
            className={`${buttonStyles.secondarySm} mt-3 flex items-center justify-center gap-1.5 border w-full`}
            href="/billing"
          >
            <FontAwesomeIcon className="text-xs" icon={faCircleArrowUp} />
            {t('sidebar.upgradePlanCta')}
          </NextLink>
        )}
      </div>
    </div>
  );

  function renderMetricRow(metric: UsageMetric) {
    const unlimited = metric.limit === -1;
    const ratio = unlimited ? 0 : metric.used / metric.limit;
    const barColor = ratio > 0.9 ? 'bg-danger' : ratio > 0.7 ? 'bg-warning' : 'bg-primary';

    return (
      <div key={metric.labelKey}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-navy-400 truncate">{t(metric.labelKey)}</span>
          <span className="font-mono text-xs text-navy-200 shrink-0">
            {unlimited ? '∞' : `${metric.used} / ${metric.limit}`}
          </span>
        </div>
        {!unlimited && (
          <div className="mt-1.5 h-1 rounded-full bg-default-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
            />
          </div>
        )}
      </div>
    );
  }
}
