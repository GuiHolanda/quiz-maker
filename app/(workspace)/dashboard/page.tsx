'use client';

import { useEffect, useState } from 'react';

import { HomeHeader } from './components/HomeHeader';
import { HomeKpiGrid } from './components/kpi/HomeKpiGrid';
import { ResumeCard } from './components/resume/ResumeCard';
import { ExamsInProgressCard } from './components/exams/ExamsInProgressCard';
import { WeakDomainsCard } from './components/weak/WeakDomainsCard';
import { QuickActionsCard } from './components/actions/QuickActionsCard';
import { ActivityCard } from './components/activity/ActivityCard';
import { CreditsCard } from './components/credits/CreditsCard';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getDashboardStats } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import type { DashboardHome } from '@/shared/types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [home, setHome] = useState<DashboardHome | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setHome)
      .catch((err) => notify.error(err?.response?.data?.message ?? t('dashboard.home.loadError')));
  }, [t]);

  return (
    <PageHeader>
      <div className="space-y-6" data-testid="dashboard-root">
        <HomeHeader
          loading={home === null}
          resumeName={home?.resume?.simuladoName ?? null}
          summaryExams={home?.examsInProgress.length ?? 0}
          summaryWrong={home?.quickActions.wrongOpenCount ?? 0}
        />

        <HomeKpiGrid kpis={home?.kpis ?? null} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="grid gap-4">
            <ResumeCard loading={home === null} resume={home?.resume ?? null} />
            <ExamsInProgressCard exams={home?.examsInProgress ?? null} />
            <WeakDomainsCard domains={home?.weakDomains ?? null} />
          </div>
          <div className="grid gap-4">
            <QuickActionsCard counts={home?.quickActions ?? null} />
            <ActivityCard items={home?.activity ?? null} />
            <CreditsCard />
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
