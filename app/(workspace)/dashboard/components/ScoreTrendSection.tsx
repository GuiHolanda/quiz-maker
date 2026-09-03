'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';

import { CardHeading } from '@/shared/components/ui/CardHeading';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardScoreTrendPoint } from '@/shared/types';

interface ScoreTrendSectionProps {
  readonly scoreTrend: DashboardScoreTrendPoint[] | null;
}

function buildSparklinePoints(trend: DashboardScoreTrendPoint[]): string {
  const width = 300;
  const height = 80;
  return trend
    .map((point, i) => {
      const x = trend.length === 1 ? width / 2 : (i / (trend.length - 1)) * width;
      const y = (1 - point.score / 100) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function ScoreTrendSection({ scoreTrend }: ScoreTrendSectionProps) {
  const { t } = useTranslation();

  const hasTrend = scoreTrend !== null && scoreTrend.length >= 2;
  const trendDelta =
    hasTrend && scoreTrend !== null ? scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score : null;

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5 shrink-0">
      <CardHeading
        className="mb-3"
        subtitle={t('dashboard.recentSessionsSubtitle')}
        action={
          trendDelta !== null && (
            <span
              className={`font-mono text-[10px] flex items-center gap-1 ${trendDelta >= 0 ? 'text-success' : 'text-danger'}`}
            >
              <FontAwesomeIcon icon={faArrowTrendUp} />
              {trendDelta >= 0 ? '+' : ''}
              {trendDelta}%
            </span>
          )
        }
      >
        {t('dashboard.scoreTrend')}
      </CardHeading>

      {scoreTrend === null ? (
        <SkeletonListLoader count={1} height="h-20" />
      ) : !hasTrend ? (
        <EmptyState
          title={t('dashboard.noScoreTrend')}
          description={t('dashboard.noScoreTrendDescription')}
          action={{ label: t('dashboard.mockExam'), href: '/simulados' }}
        />
      ) : (
        <svg className="w-full" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e07820" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#e07820" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#sparkGrad)" points={`0,80 ${buildSparklinePoints(scoreTrend)} 300,80`} />
          <polyline fill="none" points={buildSparklinePoints(scoreTrend)} stroke="#e07820" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}
