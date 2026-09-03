'use client';

import { CardHeading } from '@/shared/components/ui/CardHeading';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardDomainStat } from '@/shared/types';

import { DomainRow } from './DomainRow';

interface DomainBreakdownSectionProps {
  readonly domainBreakdown: DashboardDomainStat[] | null;
}

export function DomainBreakdownSection({ domainBreakdown }: DomainBreakdownSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent"
      data-testid="dashboard-domain-breakdown"
    >
      <div className="px-5 pt-5 pb-3 border-b border-default-200">
        <CardHeading subtitle={t('dashboard.domainBreakdownSubtitle')}>{t('dashboard.domainBreakdown')}</CardHeading>
      </div>

      <div className="p-5 space-y-4">
        {domainBreakdown === null ? (
          <SkeletonListLoader count={4} height="h-8" />
        ) : domainBreakdown.length === 0 ? (
          <EmptyState
            title={t('dashboard.noDomainBreakdown')}
            description={t('dashboard.noDomainBreakdownDescription')}
            action={{ label: t('dashboard.mockExam'), href: '/simulados' }}
          />
        ) : (
          domainBreakdown.map((domain) => <DomainRow key={domain.sectionName} domain={domain} />)
        )}
      </div>
    </section>
  );
}
