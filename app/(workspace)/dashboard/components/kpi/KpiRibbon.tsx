'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faFire, faTrophy } from '@fortawesome/free-solid-svg-icons';

import { KpiCard } from './KpiCard';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardStats, UsageStats } from '@/shared/types';

interface KpiRibbonProps {
  readonly stats: DashboardStats | null;
  readonly usage: UsageStats | null;
}

function scoreTextColor(score: number) {
  if (score >= 75) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

export function KpiRibbon({ stats, usage }: KpiRibbonProps) {
  const { t } = useTranslation();
  const isLoading = stats === null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="dashboard-kpi-ribbon">
      {/* Slot 1: Questões salvas */}
      <KpiCard
        icon={
          <div
            className="w-8 h-8 border border-success/20 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.07)' }}
          >
            <FontAwesomeIcon className="text-success text-xs" icon={faTrophy} />
          </div>
        }
        badge={
          <span
            className="font-mono text-[9px] text-success border border-success/20 rounded px-1.5 py-0.5"
            style={{ background: 'rgba(74,222,128,0.07)' }}
          >
            {t('dashboard.questionsMasteredDetail')}
          </span>
        }
        value={usage ? usage.questionsSavedInLibrary.toLocaleString('pt-BR') : '-'}
        label={t('dashboard.questionsMastered')}
        detail={t('dashboard.questionsMasteredDetail')}
      />

      {/* Slot 2: Simulados completos */}
      <KpiCard
        icon={
          <div
            className="w-8 h-8 border border-primary/20 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(224,120,32,0.07)' }}
          >
            <FontAwesomeIcon className="text-primary text-xs" icon={faBullseye} />
          </div>
        }
        badge={
          <span className="font-mono text-[9px] text-default-400 border border-default-200 rounded px-1.5 py-0.5">
            {t('dashboard.simuladosCompletedDetail')}
          </span>
        }
        value={isLoading ? '-' : String(stats.totalSimuladosCompleted)}
        label={t('dashboard.simuladosCompleted')}
        detail={t('dashboard.simuladosCompletedDetail')}
      />

      {/* Slot 3: Melhor score */}
      <KpiCard
        icon={
          <div
            className="w-8 h-8 border border-primary/20 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(224,120,32,0.07)' }}
          >
            <FontAwesomeIcon className="text-primary text-xs" icon={faBullseye} />
          </div>
        }
        badge={
          !isLoading && stats.bestScore !== null ? (
            <span className={`font-mono text-[9px] border rounded px-1.5 py-0.5 ${scoreTextColor(stats.bestScore)}`}>
              {t('dashboard.bestScoreDetail')}
            </span>
          ) : (
            <span className="font-mono text-[9px] text-default-400 border border-default-200 rounded px-1.5 py-0.5">
              {t('dashboard.bestScoreDetail')}
            </span>
          )
        }
        value={isLoading ? '-' : stats.bestScore !== null ? `${stats.bestScore}%` : '-'}
        label={t('dashboard.bestScore')}
        detail={t('dashboard.bestScoreDetail')}
      />

      {/* Slot 4: Study streak — Em breve */}
      <KpiCard
        comingSoon
        icon={
          <div
            className="w-8 h-8 border border-orange-400/20 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(251,146,60,0.07)' }}
          >
            <FontAwesomeIcon className="text-orange-400 text-xs" icon={faFire} />
          </div>
        }
        badge={null}
        value=""
        label={t('dashboard.studyStreak')}
        detail={t('dashboard.studyStreakBest', { best: '-', avg: '-' })}
      />
    </div>
  );
}
