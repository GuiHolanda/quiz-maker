'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardDomainStat } from '@/shared/types';

import { FocusAreaCard } from './FocusAreaCard';

interface FocusAreasSectionProps {
  readonly domainBreakdown: DashboardDomainStat[] | null;
}

export function FocusAreasSection({ domainBreakdown }: FocusAreasSectionProps) {
  const { t } = useTranslation();
  const focusAreas = domainBreakdown !== null ? domainBreakdown.filter((d) => d.avgScore < 70) : null;

  return (
    <div className="lg:col-span-3 bg-content1 border border-default-200 rounded-xl flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-default-200">
        <div className="flex items-center gap-2 mb-0.5">
          <FontAwesomeIcon className="text-warning text-xs" icon={faTriangleExclamation} />
          <p className="text-xs font-semibold text-primary">{t('dashboard.focusAreas')}</p>
        </div>
        <p className="text-[11px] text-default-400 mt-0.5">{t('dashboard.focusAreasSubtitle')}</p>
      </div>

      <div className="p-5 space-y-4 flex-1">
        {focusAreas === null ? (
          <SkeletonListLoader count={3} height="h-28" />
        ) : domainBreakdown!.length === 0 ? (
          <EmptyState
            title={t('dashboard.noFocusAreasYet')}
            description={t('dashboard.noFocusAreasYetDescription')}
            action={{ label: t('dashboard.mockExam'), href: '/simulados' }}
          />
        ) : focusAreas.length === 0 ? (
          <EmptyState
            title={t('dashboard.noFocusAreas')}
            description={t('dashboard.noFocusAreasDescription')}
            action={{ label: t('dashboard.mockExam'), href: '/simulados' }}
          />
        ) : (
          focusAreas.map((domain) => <FocusAreaCard key={domain.sectionName} domain={domain} />)
        )}
      </div>
    </div>
  );
}
