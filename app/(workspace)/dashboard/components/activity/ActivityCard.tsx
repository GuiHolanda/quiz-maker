'use client';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardActivityItem } from '@/shared/types';

import { ActivityRow } from './ActivityRow';

interface ActivityCardProps {
  readonly items: DashboardActivityItem[] | null;
}

export function ActivityCard({ items }: ActivityCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-activity"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">{t('dashboard.home.activityTitle')}</p>
        <span className="font-mono text-xs text-default-400 tracking-wide">{t('dashboard.home.activityWindow')}</span>
      </div>

      <div className="mt-5">
        {items === null ? (
          <SkeletonListLoader count={4} height="h-10" />
        ) : items.length === 0 ? (
          <EmptyState
            title={t('dashboard.home.activityEmpty')}
            description={t('dashboard.home.activityEmptyDescription')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, i) => (
              <ActivityRow key={`${item.kind}-${item.at}-${i}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
