'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardExamProgress } from '@/shared/types';

import { ExamProgressRow } from './ExamProgressRow';

interface ExamsInProgressCardProps {
  readonly exams: DashboardExamProgress[] | null;
}

export function ExamsInProgressCard({ exams }: ExamsInProgressCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-exams-progress"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-foreground">{t('dashboard.home.examsTitle')}</p>
        <NextLink className="flex items-center gap-1.5 text-sm font-semibold text-primary" href="/exams">
          {t('dashboard.home.examsSeeAll')}
          <FontAwesomeIcon className="text-[11px]" icon={faArrowRight} />
        </NextLink>
      </div>

      <div className="mt-2">
        {exams === null ? (
          <div className="pt-3">
            <SkeletonListLoader count={3} height="h-12" />
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            title={t('dashboard.home.examsEmpty')}
            description={t('dashboard.home.examsEmptyDescription')}
            action={{ label: t('dashboard.home.newCert'), href: '/exams' }}
          />
        ) : (
          <div className="divide-y divide-divider">
            {exams.map((exam) => (
              <ExamProgressRow key={exam.examId} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
