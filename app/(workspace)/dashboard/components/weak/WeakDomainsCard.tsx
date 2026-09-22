'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardWeakDomain } from '@/shared/types';

import { WeakDomainRow } from './WeakDomainRow';

interface WeakDomainsCardProps {
  readonly domains: DashboardWeakDomain[] | null;
}

export function WeakDomainsCard({ domains }: WeakDomainsCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-weak-domains"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{t('dashboard.home.weakTitle')}</p>
          <p className="mt-0.5 text-xs text-default-500 text-pretty">{t('dashboard.home.weakSubtitle')}</p>
        </div>
        <NextLink className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`} href="/simulados">
          <FontAwesomeIcon className="text-xs" icon={faBullseye} />
          {t('dashboard.home.weakTrainCta')}
        </NextLink>
      </div>

      <div className="mt-5">
        {domains === null ? (
          <SkeletonListLoader count={4} height="h-6" />
        ) : domains.length === 0 ? (
          <EmptyState title={t('dashboard.home.weakEmpty')} description={t('dashboard.home.weakEmptyDescription')} />
        ) : (
          <div className="flex flex-col gap-3">
            {domains.map((domain) => (
              <WeakDomainRow key={domain.sectionName} domain={domain} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
