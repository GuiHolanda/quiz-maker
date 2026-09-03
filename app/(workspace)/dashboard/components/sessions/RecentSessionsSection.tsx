'use client';

import { CardHeading } from '@/shared/components/ui/CardHeading';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardRecentSession } from '@/shared/types';

import { SessionRow } from './SessionRow';

interface RecentSessionsSectionProps {
  readonly sessions: DashboardRecentSession[] | null;
}

export function RecentSessionsSection({ sessions }: RecentSessionsSectionProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent flex flex-col flex-1"
      data-testid="dashboard-recent-sessions"
    >
      <div className="px-5 pt-5 pb-3">
        <CardHeading subtitle={t('dashboard.recentSessionsSubtitle')}>{t('dashboard.recentSessions')}</CardHeading>
      </div>

      <div className="flex-1">
        {sessions === null ? (
          <div className="px-5 py-3">
            <SkeletonListLoader count={3} height="h-12" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title={t('dashboard.noRecentSessions')}
            description={t('dashboard.noRecentSessionsDescription')}
            action={{ label: t('dashboard.mockExam'), href: '/simulados' }}
          />
        ) : (
          <div className="divide-y divide-default-100">
            {sessions.map((session, i) => (
              <SessionRow key={i} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
