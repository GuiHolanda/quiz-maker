'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlay } from '@fortawesome/free-solid-svg-icons';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardResume } from '@/shared/types';

interface ResumeCardProps {
  readonly resume: DashboardResume | null;
  readonly loading: boolean;
}

export function ResumeCard({ resume, loading }: ResumeCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) {
    return <SkeletonListLoader count={1} height="h-40" />;
  }

  if (!resume) return null;

  const board = resume.examBoardName ?? resume.examName;
  const meta =
    resume.durationMinutes !== null
      ? t('dashboard.home.resumeMeta', { board, total: resume.totalQuestions, duration: resume.durationMinutes })
      : t('dashboard.home.resumeMetaNoDuration', { board, total: resume.totalQuestions });

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-resume"
    >
      <p className="flex items-center gap-2 font-mono text-xs text-primary tracking-wide">
        <FontAwesomeIcon className="text-[11px]" icon={faPlay} />
        {t('dashboard.home.resumeKicker')}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-foreground">{resume.simuladoName}</p>
          <p className="mt-1 font-mono text-xs text-default-400">{meta}</p>
          <p className="mt-1 text-xs text-default-500">
            <RelativeDate date={resume.startedAt} />
          </p>
        </div>
        <Button
          className={buttonStyles.primary}
          endContent={<FontAwesomeIcon className="text-xs" icon={faArrowRight} />}
          onPress={() => router.push(`/simulados/${resume.mockExamId}/tentativa/${resume.attemptId}`)}
        >
          {t('dashboard.home.resumeCta')}
        </Button>
      </div>
    </div>
  );
}
