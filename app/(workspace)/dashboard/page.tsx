'use client';

import { useEffect, useState } from 'react';

import { PerformanceHeader } from './components/header/PerformanceHeader';
import { KpiRibbon } from './components/kpi/KpiRibbon';
import { FocusAreasSection } from './components/focus/FocusAreasSection';
import { ScoreTrendSection } from './components/ScoreTrendSection';
import { RecentSessionsSection } from './components/sessions/RecentSessionsSection';
import { DomainBreakdownSection } from './components/domains/DomainBreakdownSection';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { getDashboardStats } from '@/features/connectors';
import type { DashboardStats } from '@/shared/types';

const EMPTY_STATS: DashboardStats = {
  totalSimuladosCompleted: 0,
  bestScore: null,
  recentSessions: [],
  scoreTrend: [],
  domainBreakdown: [],
};

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const { usage } = useUsageContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  return (
    <PageHeader>
      <div className="space-y-5" data-testid="dashboard-root">
        <PerformanceHeader />

        <KpiRibbon stats={stats} usage={usage} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <FocusAreasSection domainBreakdown={stats?.domainBreakdown ?? null} />
          <div className="lg:col-span-2 flex flex-col gap-4">
            <ScoreTrendSection scoreTrend={stats?.scoreTrend ?? null} />
            <RecentSessionsSection sessions={stats?.recentSessions ?? null} />
          </div>
        </div>

        <DomainBreakdownSection domainBreakdown={stats?.domainBreakdown ?? null} />
      </div>
    </PageHeader>
  );
}
