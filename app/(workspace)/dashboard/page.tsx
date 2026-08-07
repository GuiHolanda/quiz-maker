'use client';

import { useEffect, useState } from 'react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip } from '@fortawesome/free-solid-svg-icons';

import { PerformanceHeader } from './components/header/PerformanceHeader';
import { KpiRibbon } from './components/kpi/KpiRibbon';
import { FocusAreasSection } from './components/focus/FocusAreasSection';
import { ScoreTrendSection } from './components/ScoreTrendSection';
import { RecentSessionsSection } from './components/sessions/RecentSessionsSection';
import { DomainBreakdownSection } from './components/domains/DomainBreakdownSection';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
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
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  return (
    <PageHeader
      title={t('nav.dashboard')}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem>{t('nav.dashboard')}</BreadcrumbItem>
        </Breadcrumbs>
      }
    >
      <div className="space-y-5">
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

        <footer className="flex items-center justify-between py-2 pb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 border border-primary/30 rounded flex items-center justify-center"
              style={{ background: 'rgba(224,120,32,0.07)' }}
            >
              <FontAwesomeIcon className="text-primary" icon={faMicrochip} style={{ fontSize: '8px' }} />
            </div>
            <span className="font-mono text-[10px] text-default-400">CertifiqueAI Dashboard</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-default-400">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            All systems operational
          </span>
        </footer>
      </div>
    </PageHeader>
  );
}
