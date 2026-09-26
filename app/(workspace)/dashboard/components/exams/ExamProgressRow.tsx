'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { readinessBar } from '@/shared/lib/examReadiness';
import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardExamProgress } from '@/shared/types';

interface ExamProgressRowProps {
  readonly exam: DashboardExamProgress;
}

export function ExamProgressRow({ exam }: ExamProgressRowProps) {
  const { t } = useTranslation();
  const meta = [exam.boardName, exam.keyLabel].filter(Boolean).join(' · ');
  const bar = readinessBar(exam.readiness, exam.passingScore);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{exam.name}</p>
        {meta && <p className="mt-0.5 truncate font-mono text-xs text-default-400">{meta}</p>}
      </div>
      <div>
        <ProgressTrack
          fillClass={bar.fillClass}
          markerPercent={bar.markerPercent}
          trackClass="bg-background"
          value={bar.value}
        />
        <p className="mt-1.5 text-xs text-default-500">{readinessLabel()}</p>
      </div>
      <span
        className={`text-right font-mono text-sm ${exam.accuracy !== null ? scoreToneText(exam.accuracy) : 'text-default-400'}`}
      >
        {exam.accuracy !== null ? `${exam.accuracy}%` : '–'}
      </span>
    </div>
  );

  function readinessLabel() {
    const { readiness } = exam;

    if (readiness.phase === 'measured') {
      return t('dashboard.home.examsReadiness', { value: readiness.projectedPercent ?? 0 });
    }

    if (readiness.phase === 'ready_to_measure') return t('dashboard.home.examsReadyToMeasure');

    return t('dashboard.home.examsBank', { covered: readiness.coveredQuestions, target: readiness.targetQuestions });
  }
}
