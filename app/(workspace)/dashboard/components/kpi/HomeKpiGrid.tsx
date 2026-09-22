'use client';

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faFileLines, faFire, faPercent } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { StatCard } from '@/shared/components/ui/StatCard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardKpis } from '@/shared/types';

interface HomeKpiGridProps {
  readonly kpis: DashboardKpis | null;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function HomeKpiGrid({ kpis }: HomeKpiGridProps) {
  const { t } = useTranslation();

  const iconBox = (icon: IconDefinition, className: string): ReactNode => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-content2">
      <FontAwesomeIcon className={`text-xs ${className}`} icon={icon} />
    </div>
  );

  const value = (v: ReactNode): ReactNode => <span className="font-mono">{v}</span>;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4" data-testid="dashboard-kpis">
      <StatCard
        icon={iconBox(faFire, 'text-primary')}
        label={t('dashboard.home.kpiStreak')}
        value={value(kpis ? kpis.streakDays : '–')}
        detail={kpis && kpis.streakDays > 0 ? t('dashboard.home.kpiStreakUnit') : t('dashboard.home.kpiStreakZero')}
      />
      <StatCard
        icon={iconBox(faCircleCheck, 'text-success')}
        label={t('dashboard.home.kpiQuestionsWeek')}
        value={value(kpis ? kpis.questionsThisWeek : '–')}
        detail={kpis ? t('dashboard.home.kpiQuestionsWeekDelta', { delta: signed(kpis.questionsWeekDelta) }) : ' '}
      />
      <StatCard
        icon={iconBox(faPercent, 'text-primary')}
        label={t('dashboard.home.kpiAvgAccuracy')}
        valueClassName={
          kpis && kpis.avgAccuracy !== null
            ? `font-mono font-bold text-2xl leading-none ${scoreToneText(kpis.avgAccuracy)}`
            : 'font-mono font-bold text-2xl leading-none text-foreground'
        }
        value={kpis && kpis.avgAccuracy !== null ? `${kpis.avgAccuracy}%` : '–'}
        detail={
          kpis && kpis.avgAccuracyDelta !== null
            ? t('dashboard.home.kpiAvgAccuracyDelta', { delta: signed(kpis.avgAccuracyDelta) })
            : ' '
        }
      />
      <StatCard
        icon={iconBox(faFileLines, 'text-default-400')}
        label={t('dashboard.home.kpiSimulados')}
        value={value(kpis ? kpis.simuladosTotal : '–')}
        detail={kpis ? t('dashboard.home.kpiSimuladosOpen', { count: kpis.simuladosOpen }) : ' '}
      />
    </div>
  );
}
